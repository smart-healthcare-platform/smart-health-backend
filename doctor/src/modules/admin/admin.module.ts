import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Doctor } from '../doctor/doctor.entity';
import { DoctorRating } from '../doctor-rating/doctor-rating.entity';
import { AppointmentSlot } from '../appointment-slot/appointment-slot.entity';
import { DoctorCertificate } from '../doctor-certificates/doctor-certificates.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Doctor,
      DoctorRating,
      AppointmentSlot,
      DoctorCertificate,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}