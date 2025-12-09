import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { AppointmentService } from 'src/module/appointment/appointment.service';
import { AppointmentProducerService } from './appointment-producer.service';
import { ConfigService } from '@nestjs/config';
import { createKafkaConfig } from './kafka.config';

@Injectable()
export class ProductionAppointmentConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProductionAppointmentConsumer.name);
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly producerService: AppointmentProducerService,
    private readonly configService: ConfigService, 
  ) { }

  async onModuleInit() {
    const { broker, clientId } = createKafkaConfig(this.configService);

    this.kafka = new Kafka({
      clientId,
      brokers: [broker],
    });

    this.consumer = this.kafka.consumer({ groupId: 'appointment-service-group' });
    await this.consumer.connect();


    await this.consumer.subscribe({
      topics: [
        'appointment.slot.confirmed',
        'appointment.slot.failed',
        'doctor.batch.get.reply',
        'patient.userId.resolved',
        'patient.detail.resolved',
      ],
    })
    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const rawValue = message.value?.toString();
          if (!rawValue) return;
          const data = JSON.parse(rawValue);

          switch (topic) {
            case 'appointment.slot.confirmed':
              await this.appointmentService.confirmAppointment(
                data.appointmentId,
                data.doctorId,
                data.slotId,
                data.patientId,
                data.patientName,
              );
              break;

            case 'appointment.slot.failed':
              await this.appointmentService.failAppointment(data.appointmentId);
              break;

            case 'patient.detail.resolved':
              this.logger.log(`Received patient detail: ${JSON.stringify(data)}`)
              this.producerService.handleReply(data)
              break

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
