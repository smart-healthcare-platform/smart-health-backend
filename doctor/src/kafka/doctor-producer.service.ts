import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class DoctorProducerService implements OnModuleInit {
  private readonly logger = new Logger(DoctorProducerService.name);

  constructor(@Inject('KAFKA_SERVICE') private readonly kafka: ClientKafka) { }

  async onModuleInit() {
    await this.kafka.connect();
    this.logger.log('Doctor producer connected');
  }

  confirmSlot(data: { appointmentId: string; doctorId: string; slotId: string; patientId: string; correlationId: string }) {
    this.logger.log(`Emit appointment.slot.confirmed: ${JSON.stringify(data)}`);
    return this.kafka.emit('appointment.slot.confirmed', data);
  }

  failSlot(data: { appointmentId: string; doctorId: string; slotId: string; correlationId: string }) {
    this.logger.log(`Emit appointment.slot.failed: ${JSON.stringify(data)}`);
    return this.kafka.emit('appointment.slot.failed', data);
  }

  async sendDoctorsInfo(data: { doctors: any[]; correlationId: string; replyTopic: string }) {
    const { doctors, correlationId, replyTopic } = data;
    const payload = { doctors, correlationId };

    this.logger.log(`Replying doctor info to ${replyTopic}: ${JSON.stringify(payload)}`);

    return this.kafka.emit(replyTopic, payload);
  }

  createUserForDoctor(data: {
    doctorId: string;
    email: string;
    fullName: string;
    dob: string;
    correlationId: string;
  }) {
    this.logger.log(`Emit user.create.from.doctor: ${JSON.stringify(data)}`);
    return this.kafka.emit('user.create.from.doctor', data);
  }
}
