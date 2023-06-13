const { createLogger, format, transports } = require('winston');

/* */
const clArgv = process.argv.slice(2);

/* Logging */
const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.errors({ stack: true }),
        format.timestamp(),
        format.printf(({ level, message, timestamp, stack }) => {
            return `${timestamp} ${level}: ${stack != undefined ? stack : message}`;
        }),
    ),
    transports: [
        new transports.Console({
            silent: clArgv.indexOf('--log-info') == -1
        })
    ],
});

if (clArgv.indexOf('--log-error') > -1)  {
    logger.add(new transports.File({
        filename: 'log/error.log',
        level: 'error'
    }));
}

module.exports = { logger };
