import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecordsController } from './medical-records.controller';
import { MedicalRecordsService } from './medical-records.service';
import { MedicalRecord } from './medical-records.entity';
import { Appointment } from '../appointment/appointment.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            MedicalRecord,
            Appointment,
        ]),
    ],
    controllers: [MedicalRecordsController],
    providers: [MedicalRecordsService],
    exports: [MedicalRecordsService],
})
export class MedicalRecordsModule { }