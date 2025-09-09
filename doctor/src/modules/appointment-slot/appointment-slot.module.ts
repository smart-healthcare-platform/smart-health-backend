import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentSlotService } from './appointment-slot.service';
import { AppointmentSlotController } from './appointment-slot.controller';
import { AppointmentSlot } from './appointment-slot.entity';
import { Doctor } from '../doctor/doctor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AppointmentSlot, Doctor])],
  providers: [AppointmentSlotService],
  controllers: [AppointmentSlotController],
  exports: [AppointmentSlotService],
})
export class AppointmentSlotModule {}
