import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ timestamp, level, message, module, ...meta }) => {
    const mod = module ? `[${module}]` : '';
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level} ${mod} ${message}${extra}`;
  }),
);

const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json(),
);

let logLevel = 'info';

export function initLogger(level: string): void {
  logLevel = level;
  rootLogger.level = level;
}

const rootLogger = winston.createLogger({
  level: logLevel,
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({
      filename: 'data/logs/app.log',
      format: fileFormat,
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3,
    }),
  ],
});

export function createLogger(module: string): winston.Logger {
  return rootLogger.child({ module });
}

export default rootLogger;
