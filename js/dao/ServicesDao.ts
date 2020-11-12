import {injectable, singleton} from "tsyringe";
import {Service} from "../model/ServiceModel";
import log from "../log/logger";

/**
 * Normally we would store stuff in DB, in this case its in-memory (the services map)
 */
@singleton()
@injectable()
export default class ServicesDao {

    services: Map<string, Service>


    constructor() {
        this.services = new Map<string, Service>();
    }

    public addService(service: Service): boolean {
        if (this.services.has(service?.serviceName)) {
            log.error(`Service '${service.serviceName}' already exists.`)
            return false
        } else if (service) {
            this.services.set(service?.serviceName, service)
            return true
        }
        return false
    }

    public updateService(service: Service): boolean {
        if (!this.services.has(service?.serviceName)) {
            log.error(`No such service '${service?.serviceName}'`)
            return false
        } else {
            this.services.set(service?.serviceName, service)
            return true
        }
    }

    public getService(serviceName: string): Service {
        return this.services.get(serviceName)
    }

    public deleteService(serviceName: string): boolean {
        return this.services.delete(serviceName)
    }
}