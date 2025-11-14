import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { InternalAppointmentController } from './controllers/internal-appointment.controller';
import { ReceptionistAppointmentController } from './controllers/receptionist-appointment.controller';
import { Appointment } from './appointment.entity';
import { HttpModule } from '@nestjs/axios';
import { KafkaModule } from 'src/kafka/kafka.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment]),
    HttpModule.register({ timeout: 30000 }),
    forwardRef(() => KafkaModule),
  ],
  providers: [AppointmentService],
  controllers: [
    AppointmentController,
    InternalAppointmentController,
    ReceptionistAppointmentController,
  ],
  exports: [AppointmentService],
})
export class AppointmentModule {}
