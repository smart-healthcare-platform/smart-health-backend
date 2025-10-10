import { Controller, Get } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('health')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  getHealth(): { status: string } {
    return this.notificationService.getHealth();
  }
}