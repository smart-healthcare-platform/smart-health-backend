import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationService {
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}