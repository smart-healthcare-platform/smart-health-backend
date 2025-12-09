import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class PatientProducerService implements OnModuleInit {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafka: ClientKafka,
  ) { }

  async onModuleInit() {
    await this.kafka.connect();
    console.log('Patient producer connected');
  }

  patientCreated(data: { patientId: string; fullName: string }) {
    console.log('Emit patient.created:', data);
    return this.kafka.emit('patient.created', data);
  }

  patientUpdated(data: { patientId: string }) {
    console.log('Emit patient.updated:', data);
    return this.kafka.emit('patient.updated', data);
  }

  forwardToDoctor(data: {
    correlationId: string;
    patientId: string;
    appointmentId: string;
    slotId: string;
    doctorId: string;
    patientName: string;
  }) {
    console.log('Emit appointment.patient.resolved:', data);
    return this.kafka.emit('appointment.patient.resolved', data);
  }

  replyPatientDetail(data: {
    correlationId: string;
    patientId: string;
    found: boolean;
    patient?: any;
  }) {
    console.log('Emit patient.detail.resolved:', data);
    return this.kafka.emit('patient.detail.resolved', data);
  }

  requestUserDetail(userId: string, correlationId: string) {
    console.log('Emit user.detail.requested:', { userId, correlationId });
    return this.kafka.emit('user.detail.requested', { userId, correlationId });
  }
}
