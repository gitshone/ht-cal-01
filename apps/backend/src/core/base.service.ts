import logger from '../utils/winston-logger';

export abstract class BaseService {
  protected logInfo(message: string, meta?: Record<string, any>): void {
    logger.info(message, meta);
  }

  protected logError(
    message: string,
    error: Error,
    meta?: Record<string, any>
  ): void {
    logger.error(message, {
      ...meta,
      error: error.message,
      stack: error.stack,
    });
  }

  protected logWarn(message: string, meta?: Record<string, any>): void {
    logger.warn(message, meta);
  }

  protected handleServiceError(
    error: Error,
    context: string,
    meta?: Record<string, any>
  ): never {
    this.logError(`Service error in ${context}`, error, meta);
    throw error;
  }
}
