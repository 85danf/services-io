import winston, {format} from "winston";
import * as winstonConf from 'winston/lib/winston/config/index'

const LOG_LEVELS = {
    LEVELS: {
        info: 'INF',
        warn: 'WRN',
        error: 'ERR',
        debug: 'DBG',
        request: 'REQ'
    },
    COLORS: {
        trace: 'gray',
        debug: 'bold gray',
        info: 'bold blue',
        warn: 'bold yellow',
        error: 'bold red',
        fatal: 'bold magenta',
        request: 'gray'
    }}

class Logger {
    private winstonLog: winston.Logger;

    public getLogger(): winston.Logger {
        if (this.winstonLog === undefined) {
            this.winstonLog = this.buildLogger()
        }
        return this.winstonLog
    }

    private buildLogger() {
        const logger = winston.createLogger({
            exitOnError: false,
            levels: {...winstonConf.npm.levels},
            format: format.combine(
                format(this.formatLogLevel)(),
                format.colorize({level: true}),
                format.timestamp(),
                format.printf(info => {
                    let {caller, stack, timestamp, level, message} = info;
                    caller = caller ? ` [${caller}]` : '';
                    stack = stack ? `\n${stack}` : '';
                    return `[${timestamp}] [${level}]${caller} ${message}${stack}`;
                })
            ),
            transports: new winston.transports.Console({
                level: 'debug',
                debugStdout: true,
                handleExceptions: true
            })
        });
        winston.addColors(LOG_LEVELS.COLORS);
        return logger;
    }

    /**
     * Log level is shortened so that we have same-length strings inside the brackets
     */
    private readonly formatLogLevel = info => {
        info.level = LOG_LEVELS.LEVELS[info.level];
        return info;
    };
}


const logger = new Logger()
const log = logger.getLogger()
export default log