import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { EmailService } from '../modules/email/email.service';
import { FirebaseService } from '../modules/firebase/firebase.service';
import { DeviceService } from '../modules/device/device.service';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private readonly kafka: Kafka;
 private readonly consumer: Consumer;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly firebaseService: FirebaseService,
    private readonly deviceService: DeviceService,
  ) {
    this.kafka = new Kafka({
      clientId: 'notification-service-consumer',
      brokers: (this.configService.get<string>('NODE_ENV') === 'test'
        ? this.configService.get<string>('KAFKA_BROKERS_E2E') ||
          'localhost:9092'
        : this.configService.get<string>('KAFKA_BROKERS') || 'localhost:9092'
      ).split(','),
    });

    this.consumer = this.kafka.consumer({
      groupId: 'notification-service-group',
    });
  }

  async onModuleInit() {
    await this.connectAndSubscribe();
    this.logger.log('KafkaConsumerService is running and subscribed.');
  }

  async onModuleDestroy() {
    await this.disconnect();
    this.logger.log('KafkaConsumerService disconnected.');
  }

  private async connectAndSubscribe() {
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: 'appointment.confirmed' });
      await this.consumer.subscribe({ topic: 'message.new' });

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          const { topic, message } = payload;
          const rawValue = message.value?.toString();

          if (!rawValue) {
            this.logger.warn(`Received an empty message from topic: ${topic}`);
            return;
          }

          this.logger.log(`Received message from topic [${topic}]`);

          try {
            switch (topic) {
              case 'appointment.confirmed':
                await this.handleAppointmentConfirmed(rawValue);
                break;
              case 'message.new':
                await this.handleNewMessage(rawValue);
                break;
              default:
                this.logger.warn(`No handler for topic: ${topic}`);
            }
          } catch (err: any) {
            this.logger.error(
              `Error processing message from topic ${topic}: ${(err as any).message}`,
              (err as any).stack,
            );
          }
        },
      });
    } catch (err: any) {
      this.logger.error('Failed to connect or subscribe to Kafka', (err as any).stack);
    }
  }

  private async handleNewMessage(rawValue: string) {
    this.logger.debug(`Processing message.new event: ${rawValue}`);
    
    const eventData: {
      recipientId: string;
      senderId: string;
      senderName: string;
      messageContent: string;
      conversationId: string;
    } = JSON.parse(rawValue);

    const { recipientId, senderName, messageContent, conversationId } = eventData;

    if (!recipientId) {
      this.logger.error('Missing recipientId in message.new event');
      return;
    }

    // Lấy tất cả devices active của recipient
    try {
      const devices = await this.deviceService.getActiveDevices(recipientId);

      if (devices.length === 0) {
        this.logger.warn(`No active devices found for user ${recipientId}`);
        return;
      }

      this.logger.log(`Found ${devices.length} active device(s) for user ${recipientId}`);

      // Gửi notification đến tất cả devices
      const notificationPromises = devices.map(async (device) => {
        try {
          // Format notification with truncated message preview
          const title = `💬 ${senderName}`;
          const preview = messageContent.length > 100 
            ? messageContent.substring(0, 100) + '...' 
            : messageContent;
          
          await this.firebaseService.sendPushNotification(
            device.deviceToken,
            title,
            preview,
          );
          this.logger.log(
            `Sent notification to ${device.deviceType} device for user ${recipientId}`,
          );
        } catch (error: any) {
          this.logger.error(
            `Failed to send notification to ${device.deviceType} device ${device.id}: ${error.message}`,
            error.stack,
          );
          // Nếu token invalid, deactivate device
          if (error.code === 'messaging/invalid-registration-token' || 
              error.code === 'messaging/registration-token-not-registered') {
            await this.deviceService.deactivateDevice(recipientId, device.deviceToken);
            this.logger.log(`Deactivated invalid device token for user ${recipientId}`);
          }
        }
      });

      await Promise.allSettled(notificationPromises);
    } catch (error: any) {
      this.logger.error(
        `Error processing message.new event for user ${recipientId}: ${error.message}`,
        error.stack,
      );
    }
  }

  private async handleAppointmentConfirmed(rawValue: string) {
    this.logger.debug(`Processing appointment.confirmed event: ${rawValue}`);
    const eventData: {
      patientEmail: string;
      doctorEmail: string;
      doctorName: string;
      appointmentTime: string;
      patientName: string;
      conversation: string;
      patientId?: string;
      doctorId?: string;
    } = JSON.parse(rawValue);

    const {
      patientEmail,
      doctorEmail,
      doctorName,
      appointmentTime,
      patientName,
      conversation,
      patientId,
      doctorId,
    } = eventData;

    if (!patientEmail || !doctorEmail) {
      this.logger.error('Missing required email addresses in appointment.confirmed event');
      return;
    }

    // Gửi email notification
    await this.emailService.notifyAppointmentConfirmation({
      doctorEmail,
      doctorName,
      patientName,
      patientEmail,
      appointmentTime,
      conversation,
    });

    // Gửi push notification cho bác sĩ (nếu có doctorId)
    if (doctorId) {
      try {
        const doctorDevices = await this.deviceService.getActiveDevices(doctorId);
        
        if (doctorDevices.length > 0) {
          this.logger.log(`Sending push notifications to ${doctorDevices.length} device(s) for doctor ${doctorId}`);
          
          const notificationPromises = doctorDevices.map(async (device) => {
            try {
              await this.firebaseService.sendPushNotification(
                device.deviceToken,
                '📅 Lịch hẹn mới',
                `Bạn có lịch khám mới với ${patientName} lúc ${new Date(appointmentTime).toLocaleString('vi-VN')}`,
              );
              this.logger.log(`Sent appointment notification to ${device.deviceType} device for doctor ${doctorId}`);
            } catch (error: any) {
              this.logger.error(
                `Failed to send notification to doctor ${device.deviceType} device: ${error.message}`,
                error.stack,
              );
              // Deactivate invalid tokens
              if (error.code === 'messaging/invalid-registration-token' || 
                  error.code === 'messaging/registration-token-not-registered') {
                await this.deviceService.deactivateDevice(doctorId, device.deviceToken);
              }
            }
          });

          await Promise.allSettled(notificationPromises);
        }
      } catch (error: any) {
        this.logger.error(
          `Error sending push notifications to doctor ${doctorId}: ${error.message}`,
          error.stack,
        );
      }
    }

    // Gửi push notification cho bệnh nhân (nếu có patientId)
    if (patientId) {
      try {
        const patientDevices = await this.deviceService.getActiveDevices(patientId);
        
        if (patientDevices.length > 0) {
          this.logger.log(`Sending push notifications to ${patientDevices.length} device(s) for patient ${patientId}`);
          
          const notificationPromises = patientDevices.map(async (device) => {
            try {
              await this.firebaseService.sendPushNotification(
                device.deviceToken,
                '✅ Lịch hẹn đã được xác nhận',
                `Lịch hẹn của bạn với ${doctorName} lúc ${new Date(appointmentTime).toLocaleString('vi-VN')} đã được xác nhận`,
              );
              this.logger.log(`Sent appointment notification to ${device.deviceType} device for patient ${patientId}`);
            } catch (error: any) {
              this.logger.error(
                `Failed to send notification to patient ${device.deviceType} device: ${error.message}`,
                error.stack,
              );
              // Deactivate invalid tokens
              if (error.code === 'messaging/invalid-registration-token' || 
                  error.code === 'messaging/registration-token-not-registered') {
                await this.deviceService.deactivateDevice(patientId, device.deviceToken);
              }
            }
          });

          await Promise.allSettled(notificationPromises);
        }
      } catch (error: any) {
        this.logger.error(
          `Error sending push notifications to patient ${patientId}: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  private async disconnect() {
    if (this.consumer) {
      await this.consumer.disconnect();
    }
 }
}
