import { Request, Response } from 'express';
import { BaseController } from '../../core/base.controller';
import { calendarService } from './calendar.service';

export class CalendarController extends BaseController {
  async connectCalendar(req: Request, res: Response) {
    const userId = this.getUserId(req);
    const googleCode = req.headers['x-google-oauth-code'] as string;

    if (!googleCode) {
      this.sendError(
        res,
        'Authorization code required to connect calendar',
        400
      );
      return;
    }

    const result = await calendarService.connectCalendar(userId, googleCode);

    this.sendSuccess(
      res,
      result,
      'Calendar connection started. You will be notified when complete.'
    );
  }

  async disconnectCalendar(req: Request, res: Response) {
    const userId = this.getUserId(req);

    await calendarService.disconnectCalendar(userId);

    this.sendSuccess(res, null, 'Google Calendar disconnected successfully');
  }

  async getConnectionStatus(req: Request, res: Response) {
    const userId = this.getUserId(req);

    const result = await calendarService.getConnectionStatus(userId);

    this.sendSuccess(res, result, 'Calendar connection status retrieved');
  }
}

export const calendarController = new CalendarController();
