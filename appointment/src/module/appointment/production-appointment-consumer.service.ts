import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { AppointmentsService } from './appointments.service';

@Injectable()
export class ProductionAppointmentConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProductionAppointmentConsumer.name);
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(private readonly appointmentsService: AppointmentsService) { }

  async onModuleInit() {
    this.kafka = new Kafka({
      clientId: 'appointment-service-consumer',
      brokers: ['localhost:9092'],
    });

    this.consumer = this.kafka.consumer({ groupId: 'appointment-service-group' });
    await this.consumer.connect();

    await this.consumer.subscribe({ topics: ['appointment.slot.confirmed', 'appointment.slot.failed', 'doctor.batch.get.reply'] });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const rawValue = message.value?.toString();
          if (!rawValue) return;
          const data = JSON.parse(rawValue);

          switch (topic) {
            case 'appointment.slot.confirmed':
              await this.appointmentsService.confirmAppointment(
                data.appointmentId, data.doctorId, data.slotId, data.patientId, data.patientName
              );
              break;
            case 'appointment.slot.failed':
              await this.appointmentsService.failAppointment(data.appointmentId);
              break;
            default:
              this.logger.warn(`Unhandled topic: ${topic}`);
          }
        } catch (error) {
          this.logger.error(`Error processing message from ${topic}: ${error.message}`, error.stack);
        }
      },
    });

    this.logger.log('Appointment consumer is running');
  }

  async onModuleDestroy() {
    if (this.consumer) await this.consumer.disconnect();
    this.logger.log('Appointment consumer disconnected');
  }
}
