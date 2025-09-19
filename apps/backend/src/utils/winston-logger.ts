import winston from 'winston';
import path from 'path';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  websocket: 4,
  jobqueue: 5,
  debug: 6,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  websocket: 'cyan',
  jobqueue: 'blue',
  debug: 'white',
};

winston.addColors(colors);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
      winston.format.colorize({ all: true }),
      winston.format.printf(
        info => `${info.timestamp} ${info.level}: ${info.message}`
      )
    ),
  }),
];

if (process.env.NODE_ENV !== 'test') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(process.cwd(), 'apps/backend/logs/error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(process.cwd(), 'apps/backend/logs/combined.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  transports,
  exitOnError: false,
});

interface ExtendedLogger extends winston.Logger {
  websocket: winston.LeveledLogMethod;
  jobqueue: winston.LeveledLogMethod;
}

export default logger as ExtendedLogger;

export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
