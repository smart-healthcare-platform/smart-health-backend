import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class PatientProducerService implements OnModuleInit {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafka: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafka.connect();
    console.log('Patient producer connected');
  }

  // Khi tạo bệnh nhân mới, bắn event
  patientCreated(data: { patientId: string; fullName: string }) {
    console.log('Emit patient.created:', data);
    return this.kafka.emit('patient.created', data);
  }

  // Khi update bệnh nhân
  patientUpdated(data: { patientId: string }) {
    console.log('Emit patient.updated:', data);
    return this.kafka.emit('patient.updated', data);
  }
  resolevePatientId(data: { patientId: string ;appointmentId: string,slotId:string;doctorId:string, patientName:string}) {
    console.log('Emit appointment.booked:', data);
    return this.kafka.emit('appointment.booked', data);
  }
}
