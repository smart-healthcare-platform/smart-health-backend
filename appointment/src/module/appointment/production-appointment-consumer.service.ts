import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { AppointmentsService } from './appointments.service';

@Injectable()
export class ProductionAppointmentConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProductionAppointmentConsumer.name);
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private readonly appointmentsService: AppointmentsService,
  ) {}

  async onModuleInit() {
    this.logger.log('Starting Production Appointment Consumer...');
    
    this.kafka = new Kafka({
      clientId: 'appointment-service-consumer',
      brokers: ['localhost:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.consumer = this.kafka.consumer({ 
      groupId: 'appointment-service-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    await this.consumer.connect();
    this.logger.log('Kafka consumer connected');

    // Subscribe to multiple topics
    await this.consumer.subscribe({ topics: ['appointment.slot.confirmed', 'appointment.slot.failed'] });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message, heartbeat }) => {
        try {
          await this.processMessage(topic, message);
          await heartbeat();
        } catch (error) {
          this.logger.error(`Error processing message from ${topic}: ${error.message}`, error.stack);
        }
      },
    });

    this.logger.log('Production Appointment Consumer is running');
  }

  private async processMessage(topic: string, message: any) {
    const messageId = `${message.partition}-${message.offset}`;
    this.logger.log(`Processing message from ${topic} [${messageId}]`);
    
    try {
      // Parse message
      const rawValue = message.value?.toString();
      if (!rawValue) {
        this.logger.warn(`Empty message value [${messageId}]`);
        return;
      }

      const data = JSON.parse(rawValue);
      this.logger.log(`Parsed data [${messageId}]:`, data);

      // Route to appropriate handler
      switch (topic) {
        case 'appointment.slot.confirmed':
          await this.handleSlotConfirmed(data, messageId);
          break;
        case 'appointment.slot.failed':
          await this.handleSlotFailed(data, messageId);
          break;
        default:
          this.logger.warn(`Unknown topic: ${topic}`);
      }

    } catch (error) {
      this.logger.error(`Failed to process message [${messageId}]: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async handleSlotConfirmed(data: any, messageId: string) {
    try {
      const { appointmentId, doctorId, slotId } = data;
      
      if (!appointmentId) {
        this.logger.error(`Missing appointmentId in slot confirmed [${messageId}]`);
        return;
      }

      this.logger.log(`Confirming appointment [${messageId}]: ${appointmentId}`);
      await this.appointmentsService.confirmAppointment(appointmentId, doctorId, slotId);
      
      this.logger.log(`Appointment confirmed successfully [${messageId}]: ${appointmentId}`);
    } catch (error) {
      this.logger.error(`Failed to confirm appointment [${messageId}]: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async handleSlotFailed(data: any, messageId: string) {
    try {
      const { appointmentId } = data;
      
      if (!appointmentId) {
        this.logger.error(`Missing appointmentId in slot failed [${messageId}]`);
        return;
      }

      this.logger.log(`Failing appointment [${messageId}]: ${appointmentId}`);
      await this.appointmentsService.failAppointment(appointmentId);
      
      this.logger.log(`Appointment failed successfully [${messageId}]: ${appointmentId}`);
    } catch (error) {
      this.logger.error(`Failed to fail appointment [${messageId}]: ${error.message}`, error.stack);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.logger.log('Production Appointment Consumer disconnected');
    }
  }
}