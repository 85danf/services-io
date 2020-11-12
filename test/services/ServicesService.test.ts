import {Service} from "../../js/model/ServiceModel";
import ServicesService from "../../js/services/ServicesService";
import ServicesDao from "../../js/dao/ServicesDao";
import {capture, instance, mock, when} from "ts-mockito";
import express from "express";


const HOUSE_CLEANING_SERVICE_NAME = "housecleaning";
const PARAM_APARTMENT_SIZE = "apartmentSize";
const PARAM_DATE = "date";
const PARAM_WITH_POLISH = "withPolish";

const TEST_SERVICE: Service = {
    serviceName: HOUSE_CLEANING_SERVICE_NAME,
    basePrice: 35,
    variations: {
        [PARAM_APARTMENT_SIZE]: [
            {
                expression: "50 > ${X}",
                price: 30,
                rank: 1
            },
            {
                expression: "${X} > 50 && ${X} < 70",
                price: 42,
                rank: 1
            },
            {
                expression: "${X} == 25",
                price: 15,
                rank: 4
            }
        ]
    },
    staticRules: [
        {
            priceChange: 0.9,
            param: PARAM_DATE,
            expression: "(new Date('${X}')).getDay() == 5"
        },
        {
            priceChange: 1.2,
            param: PARAM_DATE,
            expression: "(new Date('${X}')).getDay() == 7"
        },
        {
            priceChange: 1.2,
            param: PARAM_WITH_POLISH,
            expression: "${X} == true"
        }
    ]
}

describe('Services Test', () => {

    let servicesService: ServicesService
    let servicesDao: ServicesDao
    let response: express.Response


    beforeEach(() => {
        response = mock<express.Response>()
        servicesDao = mock<ServicesDao>()
        servicesService = new ServicesService(instance(servicesDao))
    })

    test("1 variation and 1 static rule", async () => {

        when(servicesDao.getService(HOUSE_CLEANING_SERVICE_NAME)).thenReturn(TEST_SERVICE)

        servicesService.getQuote(HOUSE_CLEANING_SERVICE_NAME, {[PARAM_APARTMENT_SIZE]: 32, [PARAM_DATE]: '2020-11-13'}, instance(response))

        const [actualPrice] = capture(response.send).first()
        expect(actualPrice).toEqual("27")
    })

    test("2 static rules", async () => {
        when(servicesDao.getService(HOUSE_CLEANING_SERVICE_NAME)).thenReturn(TEST_SERVICE)

        servicesService.getQuote(HOUSE_CLEANING_SERVICE_NAME, {[PARAM_WITH_POLISH]: "true", [PARAM_DATE]: '2020-11-13'}, instance(response))

        const [actualPrice] = capture(response.send).first()
        expect(actualPrice).toEqual("38.5")
    })

    test("2 possible variation, the best ranked one wins", async () => {

        when(servicesDao.getService(HOUSE_CLEANING_SERVICE_NAME)).thenReturn(TEST_SERVICE)

        servicesService.getQuote(HOUSE_CLEANING_SERVICE_NAME, {[PARAM_APARTMENT_SIZE]: 25, [PARAM_DATE]: '2020-11-10'}, instance(response))

        const [actualPrice] = capture(response.send).first()
        expect(actualPrice).toEqual("15")
    })
})