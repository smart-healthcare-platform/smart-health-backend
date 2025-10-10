import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { EmailService } from '../modules/email/email.service';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private readonly kafka: Kafka;
  private readonly consumer: Consumer;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
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
              default:
                this.logger.warn(`No handler for topic: ${topic}`);
            }
          } catch (err: any) {
            this.logger.error(
              `Error processing message from topic ${topic}: ${err.message}`,
              err.stack,
            );
          }
        },
      });
    } catch (err: any) {
      this.logger.error('Failed to connect or subscribe to Kafka', err.stack);
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
    } = JSON.parse(rawValue);

    const {
      patientEmail,
      doctorEmail,
      doctorName,
      appointmentTime,
      patientName,
      conversation
    } = eventData;

    if (!patientEmail || !doctorEmail) {
      this.logger.error('Missing required email addresses in appointment.confirmed event');
      return;
    }

    await this.emailService.notifyAppointmentConfirmation({
      doctorEmail,
      doctorName,
      patientName,
      patientEmail,
      appointmentTime,
      conversation,
    });
  }

  private async disconnect() {
    if (this.consumer) {
      await this.consumer.disconnect();
    }
 }
}
