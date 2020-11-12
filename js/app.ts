import "reflect-metadata"
import bodyParser from 'body-parser';
import http, {Server} from 'http';
import {container} from "tsyringe";
import express from 'express';
import log from './log/logger'
import ServicesController from "./routes/ServicesController";

class ServicesIOApp {
    private app: express.Express;
    private httpServer: Server;


    async main() {
        this.app = express();
        this.app.disable('x-powered-by');
        this.app.use(bodyParser.json());
        this.app.use(express.json());
        this.setUnhandledRejectionLogHandler(log)
        this.setResponseErrorHandler()
        this.app.use('/v1/services', container.resolve(ServicesController).router)
        this.httpServer = new http.Server(this.app);
        this.httpServer.listen('8080', () => log.info(`Services.IO Backend listening on port 8080`));
    }

    private setResponseErrorHandler() {
        this.app.use(async (err: any, _req: express.Request, res: express.Response,
            next: express.NextFunction): Promise<express.Response> => {
            // TODO: Ideally I would add error handling based on a BackendError object that holds status code and message.
            return res.format({
                json: () => res.status(err.status || 500).json({error: err.message}),
                html: () => next(err),
                default: () => res.status(500),
            });
        });
    }

    private setUnhandledRejectionLogHandler(logger: any) {
        process.on('unhandledRejection', (reason: any, _promise: Promise<any>) => {
            console.error(`Unhandled Rejection: `, reason);
            console.trace();
        });
    }
}

const app = new ServicesIOApp()
app.main();