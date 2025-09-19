import { prisma } from '../lib/prisma';
import logger from '../utils/winston-logger';

export abstract class BaseRepository {
  protected prisma = prisma;

  protected logInfo(message: string, meta?: Record<string, any>): void {
    logger.info(message, meta);
  }

  protected logQuery(
    operation: string,
    table: string,
    meta?: Record<string, any>
  ): void {
    logger.debug(`Database query: ${operation} on ${table}`, meta);
  }

  protected logError(
    operation: string,
    table: string,
    error: Error,
    meta?: Record<string, any>
  ): void {
    logger.error(`Database error: ${operation} on ${table}`, {
      ...meta,
      error: error.message,
      stack: error.stack,
    });
  }

  protected async executeQuery<T>(
    operation: string,
    table: string,
    queryFn: () => Promise<T>,
    meta?: Record<string, any>
  ): Promise<T> {
    try {
      this.logQuery(operation, table, meta);
      const result = await queryFn();
      return result;
    } catch (error) {
      this.logError(operation, table, error as Error, meta);
      throw error;
    }
  }
}
