import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorAvailabilityService } from './doctor-availability.service';
import { DoctorAvailabilityController } from './doctor-availability.controller';
import { DoctorAvailability } from './doctor-availability.entity';
import { Doctor } from '../doctor/doctor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorAvailability, Doctor])],
  providers: [DoctorAvailabilityService],
  controllers: [DoctorAvailabilityController],
  exports: [DoctorAvailabilityService],
})
export class DoctorAvailabilityModule {}
