import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './patient.entity';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { PatientSeed } from './patient.seed';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient]),
  ],
  providers: [PatientService,PatientSeed],
  controllers: [PatientController],
  exports: [PatientService],
})
export class PatientModule { }
