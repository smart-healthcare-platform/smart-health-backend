import { Injectable } from '@nestjs/common';
import { FirebaseService } from './firebase/firebase.service';

@Injectable()
export class NotificationService {
  constructor(private readonly firebaseService: FirebaseService) {}

  getHello(): string {
    return 'Hello from Notification Service!';
  }

  async sendTestPushNotification(
    deviceToken: string,
    title: string,
    body: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const messageId = await this.firebaseService.sendPushNotification(
        deviceToken,
        title,
        body,
      );

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
