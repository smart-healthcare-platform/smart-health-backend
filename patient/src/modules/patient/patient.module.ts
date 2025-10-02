import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Patient } from './patient.entity';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { PatientProducerService } from './patient-producer.service';
import { PatientConsumerService } from './production-patient-consumer';
import { MedicalRecord } from '../medical-records/medical-records.entity';
import { Prescription } from '../prescriptions/prescription.entity';
import { PrescriptionItem } from '../precription-items/precription-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, MedicalRecord, Prescription, PrescriptionItem]),
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'patient-service-producer',
            brokers: ['localhost:9092'],
          },
          producerOnlyMode: true,
        },
      },
    ]),
  ],
  providers: [
    PatientService,
    PatientProducerService,
    PatientConsumerService,
  ],
  controllers: [PatientController],
  exports: [PatientService],
})
export class PatientModule {}
