import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  constructor(private readonly configService: ConfigService) {
    const firebaseCredentialsPath = this.configService.get<string>('FIREBASE_CREDENTIALS_PATH');
    
    if (!firebaseCredentialsPath) {
      throw new Error('FIREBASE_CREDENTIALS_PATH environment variable is required');
    }

    // Initialize Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(firebaseCredentialsPath),
    });
  }

  async onModuleInit() {
    this.logger.log('Firebase Service initialized');
  }

  async sendPushNotification(deviceToken: string, title: string, body: string) {
    try {
      const message = {
        notification: {
          title,
          body,
        },
        token: deviceToken,
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Successfully sent push notification: ${response}`);
      return response;
    } catch (error: any) {
      this.logger.error(`Failed to send push notification: ${error.message}`, error.stack);
      throw error;
    }
  }
}