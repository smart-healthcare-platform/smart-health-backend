import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';
import { Doctor } from './doctor.entity';
import { DoctorCertificate } from '../doctor-certificates/doctor-certificates.entity';
import { DoctorBlockTime } from '../doctor-block-time/doctor-block-time.entity';
import { DoctorRating } from '../doctor-rating/doctor-rating.entity';
import { DoctorAvailability } from '../doctor-availability/doctor-availability.entity';
import { AppointmentSlot } from '../appointment-slot/appointment-slot.entity';
import { DoctorSeed } from './doctor.seed';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Doctor,
      DoctorCertificate,
      DoctorAvailability,
      DoctorBlockTime,
      DoctorRating,
      AppointmentSlot,
    ]),
  ],
  controllers: [DoctorController],
  providers: [DoctorService, DoctorSeed],
  exports: [DoctorService],
})
export class DoctorModule {}
