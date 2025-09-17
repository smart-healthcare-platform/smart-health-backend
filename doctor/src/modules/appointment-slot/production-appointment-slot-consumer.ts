import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { AppointmentSlotService } from 'src/modules/appointment-slot/appointment-slot.service';
import { AppointmentSlotProducerService } from 'src/modules/appointment-slot/appointment-slot-producer.service';

@Injectable()
export class ProductionAppointmentSlotConsumer  implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProductionAppointmentSlotConsumer.name);
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private readonly slotService: AppointmentSlotService,
    private readonly producer: AppointmentSlotProducerService,
  ) {}

  async onModuleInit() {
    this.logger.log('Starting Production Kafka Consumer...');
    
    this.kafka = new Kafka({
      clientId: 'doctor-service-consumer',
      brokers: ['localhost:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.consumer = this.kafka.consumer({ 
      groupId: 'doctor-service-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    await this.consumer.connect();
    this.logger.log('Kafka consumer connected');

    await this.consumer.subscribe({ 
      topic: 'appointment.book.requested',
      fromBeginning: false, // Only process new messages
    });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message, heartbeat }) => {
        try {
          await this.processBookingRequest(message);
          await heartbeat(); // Maintain connection
        } catch (error) {
          this.logger.error(`Error processing message: ${error.message}`, error.stack);
          // Don't throw - let consumer continue processing other messages
        }
      },
    });

    this.logger.log('Production Kafka Consumer is running');
  }

  private async processBookingRequest(message: any) {
    const messageId = `${message.partition}-${message.offset}`;
    this.logger.log(`Processing booking request [${messageId}]`);
    
    try {
      // Parse message
      const rawValue = message.value?.toString();
      if (!rawValue) {
        this.logger.warn(`Empty message value [${messageId}]`);
        return;
      }

      const data = JSON.parse(rawValue);
      this.logger.log(`Parsed booking data [${messageId}]:`, data);

      // Validate required fields
      const { doctorId, slotId, patientId, appointmentId } = data;
      if (!doctorId || !slotId || !patientId || !appointmentId) {
        this.logger.error(`Missing required fields [${messageId}]:`, { doctorId, slotId, patientId, appointmentId });
        return;
      }

      // Process booking using NestJS services
      this.logger.log(`Checking slot availability [${messageId}]: doctor=${doctorId}, slot=${slotId}`);
      const slotAvailable = await this.slotService.isSlotAvailable(doctorId, slotId);

      if (slotAvailable) {
        // Book the slot
        await this.slotService.bookSlot(doctorId, slotId, patientId);
        
        // Notify appointment service - success
        await this.producer.confirmSlot({ appointmentId, doctorId, slotId });
        
        this.logger.log(`Slot booked successfully [${messageId}]: ${slotId} for doctor ${doctorId}`);
      } else {
        // Notify appointment service - failure
        await this.producer.failSlot({ appointmentId, doctorId, slotId });
        
        this.logger.warn(`Slot unavailable [${messageId}]: ${slotId} for doctor ${doctorId}`);
      }

    } catch (error) {
      this.logger.error(`Failed to process booking request [${messageId}]: ${error.message}`, error.stack);
      throw error; // Re-throw to trigger retry logic if needed
    }
  }

  async onModuleDestroy() {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.logger.log('Production Kafka Consumer disconnected');
    }
  }
}