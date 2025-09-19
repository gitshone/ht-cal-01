import { Request, Response } from 'express';
import { ApiResponse } from '@ht-cal-01/shared-types';
import { AuthenticationRequiredError } from '../errors/http.errors';
import { Exception } from '@tsed/exceptions';

export abstract class BaseController {
  protected sendSuccess<T>(
    res: Response,
    data: T,
    message: string,
    statusCode = 200
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
    };
    res.status(statusCode).json(response);
  }

  protected sendError(res: Response, message: string, statusCode = 400): void {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message,
    };
    res.status(statusCode).json(response);
  }

  protected getUserId(req: Request): string {
    if (!req.user) {
      throw new AuthenticationRequiredError();
    }
    const userId = req.user.userId;
    if (!userId) {
      throw new AuthenticationRequiredError();
    }
    return userId;
  }

  public handleAsync(
    fn: (req: Request, res: Response) => Promise<void>
  ): (req: Request, res: Response) => void {
    return (req: Request, res: Response) => {
      fn(req, res).catch(error => {
        if (error instanceof Exception) {
          res.status(error.status).json(error.body);
          return;
        }

        this.sendError(res, 'Internal server error', 500);
      });
    };
  }
}
