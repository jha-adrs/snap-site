import winston from 'winston';
import config from './config';
import 'winston-daily-rotate-file';
import DailyRotateFile from 'winston-daily-rotate-file';
// Format error stack trace
const enumerateErrorFormat = winston.format((info) => {
    if (info instanceof Error) {
        Object.assign(info, { message: info.stack });
    }
    return info;
});

// const getCircularReplacer = () => {
//     const seen = new WeakSet();
//     return (key, value) => {
//         if (typeof value === "object" && value !== null) {
//             if (seen.has(value)) {
//                 return;
//             }
//             seen.add(value);
//         }
//         return value;
//     };
// };

const transport: DailyRotateFile = new winston.transports.DailyRotateFile({
    filename: 'logs/%DATE%.log',
    datePattern: 'YYYY-MM-DD-HH',
    maxSize: '20m',
    zippedArchive: true,
});
// transport.on('rotate', function (oldFilename, newFilename) {

// });

const logger = winston.createLogger({
    level: config.env === 'development' ? 'debug' : 'info',
    format: winston.format.combine(
        enumerateErrorFormat(),
        winston.format.metadata(),
        config.env === 'development' ? winston.format.colorize() : winston.format.uncolorize(),
        winston.format.splat(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(
            ({ level, message, timestamp, metadata }) =>
                `${timestamp} ${level}: ${message} ${Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : ''}`
        )
    ),
    transports: [
        new winston.transports.Console({
            stderrLevels: ['error'],
        }),
        transport,
    ],
});
export default logger;
