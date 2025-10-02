// doctor-consumer.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { AppointmentSlotService } from 'src/modules/appointment-slot/appointment-slot.service';
import { DoctorProducerService } from './doctor-producer.service';
import { DoctorService } from 'src/modules/doctor/doctor.service';

@Injectable()
export class DoctorConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DoctorConsumer.name);
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private readonly slotService: AppointmentSlotService,
    private readonly producerService: DoctorProducerService,
    private readonly doctorService: DoctorService,
  ) { }

  async onModuleInit() {
    this.kafka = new Kafka({
      clientId: 'doctor-service-consumer',
      brokers: ['localhost:9092'],
    });

    this.consumer = this.kafka.consumer({ groupId: 'doctor-service-group' });

    await this.consumer.connect();

    // Sub các topic cần xử lý
    await this.consumer.subscribe({ topic: 'appointment.booked' });
    await this.consumer.subscribe({ topic: 'doctor.batch.get' });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const rawValue = message.value?.toString();
        if (!rawValue) return;

        try {
          switch (topic) {
            case 'appointment.booked':
              await this.processBookingRequest(rawValue);
              break;
            case 'doctor.batch.get':
              await this.processDoctorInfoRequest(rawValue);
              break;
            default:
              this.logger.warn(`Unhandled topic: ${topic}`);
          }
        } catch (err) {
          this.logger.error(`Error processing ${topic}: ${err.message}`, err.stack);
        }
      },
    });

    this.logger.log('DoctorConsumer is running');
  }

  // Booking flow
  private async processBookingRequest(rawValue: string) {
    const data = JSON.parse(rawValue);
    const { doctorId, slotId, patientId, appointmentId,patientName } = data;
    this.logger.log(`Process booking: ${JSON.stringify(data)}`);

    const slotAvailable = await this.slotService.isSlotAvailable(doctorId, slotId);

    if (slotAvailable) {
      await this.slotService.bookSlot(doctorId, slotId, patientId);
      await this.producerService.confirmSlot({ appointmentId, doctorId, slotId, patientId, patientName });
    } else {
      await this.producerService.failSlot({ appointmentId, doctorId, slotId });
    }
  }

  private async processDoctorInfoRequest(rawValue: string) {
    const data = JSON.parse(rawValue);
    const { doctorIds, correlationId, replyTopic } = data;

    this.logger.log(`Process doctor info request: ${JSON.stringify(data)}`);

    const doctors = await this.doctorService.findByIds(doctorIds);

    await this.producerService.sendDoctorsInfo({
      doctors,
      correlationId,
      replyTopic,
    });
  }

  async onModuleDestroy() {
    if (this.consumer) await this.consumer.disconnect();
    this.logger.log('DoctorConsumer disconnected');
  }
}
