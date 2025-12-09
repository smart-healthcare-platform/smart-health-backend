import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentSlot } from './appointment-slot.entity';
import { AppointmentSlotService } from './appointment-slot.service';
import { AppointmentSlotController } from './appointment-slot.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AppointmentSlot])],
  providers: [AppointmentSlotService],
  controllers: [AppointmentSlotController],
  exports: [AppointmentSlotService],
})
export class AppointmentSlotModule {}
