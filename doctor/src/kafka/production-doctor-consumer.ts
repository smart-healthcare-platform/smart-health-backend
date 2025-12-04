import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { AppointmentSlotService } from 'src/modules/appointment-slot/appointment-slot.service';
import { DoctorProducerService } from './doctor-producer.service';
import { DoctorService } from 'src/modules/doctor/doctor.service';
import { ConfigService } from '@nestjs/config';
import { createKafkaConfig } from './kafka.config';

@Injectable()
export class DoctorConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DoctorConsumer.name);
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private readonly slotService: AppointmentSlotService,
    private readonly producerService: DoctorProducerService,
    private readonly doctorService: DoctorService,
    private readonly configService: ConfigService,

  ) { }

  async onModuleInit() {
    const { broker, clientId } = createKafkaConfig(this.configService);

    this.kafka = new Kafka({
      clientId,
      brokers: [broker],
    });

    this.consumer = this.kafka.consumer({ groupId: 'doctor-service-group' });
    await this.consumer.connect();

    await this.consumer.subscribe({ topic: 'appointment.book.requested' });
    await this.consumer.subscribe({ topic: 'doctor.batch.get' });
    await this.consumer.subscribe({ topic: 'doctor.user.created' });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const rawValue = message.value?.toString();
        if (!rawValue) return;

        try {
          switch (topic) {
            case 'appointment.book.requested':
              await this.processBookingRequest(rawValue);
              break;
            case 'doctor.batch.get':
              await this.processDoctorInfoRequest(rawValue);
              break;
            case 'doctor.user.created':
              await this.processDoctorUserCreated(rawValue);
              break;
            default:
              this.logger.warn(`Unhandled topic: ${topic}`);
          }
        } catch (err) {
          this.logger.error(`Error processing ${topic}: ${err.message}`, err.stack);
        }
      },
    });

    this.logger.log(`DoctorConsumer is running (clientId: ${clientId})`);
  }

  private async processBookingRequest(rawValue: string) {
    const data = JSON.parse(rawValue);
    const { doctorId, slotId, patientId, appointmentId, correlationId } = data;

    this.logger.log(`Process booking: ${JSON.stringify(data)}`);

    const slotAvailable = await this.slotService.isSlotAvailable(doctorId, slotId);

    if (slotAvailable) {
      await this.slotService.bookSlot(doctorId, slotId, patientId);
      await this.producerService.confirmSlot({ appointmentId, doctorId, slotId, patientId, correlationId });
    } else {
      await this.producerService.failSlot({ appointmentId, doctorId, slotId, correlationId });
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

  private async processDoctorUserCreated(rawValue: string) {
    const data = JSON.parse(rawValue);
    const { doctorId, userId, correlationId } = data;

    this.logger.log(`Doctor user created reply: ${JSON.stringify(data)}`);

    // Lấy doctorId từ correlationId nếu có
    const storedDoctorId = await this.doctorService.getDoctorIdFromCorrelation(correlationId);
    const finalDoctorId = storedDoctorId ?? doctorId;

    await this.doctorService.updateDoctorUserId(finalDoctorId, userId);

    await this.doctorService.deleteCorrelation(correlationId);

    this.logger.log(`Updated doctor ${finalDoctorId} with userId ${userId}`);
  }


  async onModuleDestroy() {
    if (this.consumer) await this.consumer.disconnect();
    this.logger.log('DoctorConsumer disconnected');
  }
}
