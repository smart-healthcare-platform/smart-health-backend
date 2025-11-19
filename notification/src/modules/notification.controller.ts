import { Controller, Get, Post, Body } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('health')
  getHealth(): string {
    return this.notificationService.getHello();
  }

  @Post('test-push')
  async testPush(
    @Body() body: { deviceToken: string; title: string; body: string },
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return await this.notificationService.sendTestPushNotification(
      body.deviceToken,
      body.title,
      body.body,
    );
  }
}
