import express from 'express';
import {injectable, singleton} from "tsyringe";
import ServicesService from "../services/ServicesService";

@singleton()
@injectable()
export default class ServicesController {

    public readonly router = express.Router();
    private readonly servicesService: ServicesService


    constructor(servicesService: ServicesService) {
        this.servicesService = servicesService
        this.router.get('/:serviceName/quote', this.getQuote)
        this.router.post('/', this.addService)
        this.router.put('/:serviceName', this.editService)
        this.router.delete('/:serviceName', this.deleteService)
    }

    private addService = async (req: express.Request, res: express.Response) => {
        return this.servicesService.addService(req?.body, res)
    }

    private getQuote = async (req: express.Request, res: express.Response) => {
        return this.servicesService.getQuote(req?.params?.serviceName, req.query, res)
    }

    private editService = async (req: express.Request, res: express.Response) => {
        return this.servicesService.editService(req?.body, res)
    }

    private deleteService = async (req: express.Request, res: express.Response) => {
        return this.servicesService.deleteService(req?.params?.serviceName, res)
    }
}