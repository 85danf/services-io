import ServicesDao from "../dao/ServicesDao";
import {injectable, singleton} from "tsyringe";
import {Service, VariationRule} from "../model/ServiceModel";
import express from "express";
import log from "../log/logger";
const vm = require('vm')

@singleton()
@injectable()
export default class ServicesService {

    private readonly servicesDao: ServicesDao

    constructor(servicesDao: ServicesDao) {
        this.servicesDao = servicesDao;
    }

    public addService(service: Service, res: express.Response) {
        if (this.servicesDao.addService(service)) {
            // Ideally, with less time constraints I would use a BackendError that holds status and message and throw it - letting a error handler middleware deal with the response in one place
            res.sendStatus(201)
        } else {
            res.sendStatus(400)
        }
    }

    public editService(service: Service, res: express.Response) {
        if (this.servicesDao.updateService(service)) {
            res.sendStatus(200)
        } else {
            res.sendStatus(404)
        }
    }

    public deleteService(serviceName: string, res: express.Response) {
        if (this.servicesDao.deleteService(serviceName)) {
            res.sendStatus(200)
        } else {
            res.sendStatus(404)
        }
    }

    public getQuote(serviceName: string, params: any, res: express.Response) {
        const service = this.servicesDao.getService(serviceName)
        if (!service) {
            const err = `Service ${serviceName} does not exist.`
            log.error(err)
            return res.status(404).send(err)
        }
        // Calculate base price according to price variation rules
        const basePrice = this.calculateBasePrice(params, service);

        // Calculate final price based on static rules
        const finalPrice = this.calculateFinalPrice(basePrice, service, params);
        return res.send(`${finalPrice}`)
    }

    private calculateBasePrice(params: any, service: Service) {
        let candidatePrices = []
        // Start by running through the available variations of this service and attempt to find a suitable one
        for (let [param, val] of Object.entries(params)) {
            const variations: VariationRule[] = service.variations?.[param]
            if (variations) {
                // Take the rank of whatever rule matched the parameter, we'll get the best ranking match at the end.
                const {rank, price} = ServicesService.inferPriceFromVariations(variations, param, val)
                if (rank) {
                    candidatePrices.push({rank: rank, price: price})
                }
            }
        }

        let price: number
        if (candidatePrices.length) {
            const sortedCandidatePrices = candidatePrices.sort((variationLeft, variationRight) => (ServicesService.compareNumbers(variationLeft.rank, variationRight.rank)))
            price = sortedCandidatePrices[0].price
        } else {
            // If not rules matched, use the base price.
            price = service.basePrice
        }
        return price;
    }

    private static inferPriceFromVariations(variations: VariationRule[], parameter: string, queryValue: any): { rank: number, price: number } {
        let matchingVariations = []
        let chosenVariation = {rank: undefined, price: undefined}
        for (let variation of variations) {
            if (this.expressionsMatches(variation.expression, parameter, queryValue)) {
                matchingVariations.push({rank: variation.rank, price: variation.price})
            }
        }
        if (matchingVariations.length) {
            let sortedMatchingVariations = matchingVariations.sort((variationLeft, variationRight) => (ServicesService.compareNumbers(variationLeft.rank, variationRight.rank)))
            chosenVariation = sortedMatchingVariations[0]
        }
        return chosenVariation
    }

    private calculateFinalPrice(price: number, service: Service, params: any) {
        const basePrice = price
        // Now add the price changes from the static rules on top to get the final price
        for (let staticRule of service.staticRules) {
            if (params[staticRule.param] && ServicesService.expressionsMatches(staticRule.expression, staticRule.param, params[staticRule.param])) {
                if (staticRule.priceChange >= 1) {
                    // Add the price change (from the chosen base price) from the final price
                    price += ((staticRule.priceChange - 1) * basePrice)
                } else {
                    // Subtract the price change (from the chosen base price) from the final price
                    price -= (basePrice - (staticRule.priceChange * basePrice))
                }
            }
        }
        return price;
    }

    private static expressionsMatches(expression: string, parameter: string, value: any): boolean {
        expression = expression.replace(/\$\{X\}/g, value)
        try {
            return vm.runInThisContext(expression, {displayErrors: true, timeout: 3000})
        } catch (err) {
            log.error(`Error evaluating expression ${expression} and parameter ${parameter} with value ${value}: `, err)
        }
    }

    // Its late and I'm tired :)
    private static compareNumbers(left: number, right: number): number {
        if (left > right) {
            return -1
        } else if (right > left) {
            return 1
        } else {
            return 0
        }
    }
}