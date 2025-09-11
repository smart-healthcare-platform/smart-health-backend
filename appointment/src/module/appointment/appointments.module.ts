import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointment.controller';
import { Appointment } from './appointment.entity';


@Module({
    imports: [TypeOrmModule.forFeature([Appointment])],
    providers: [AppointmentsService],
    controllers: [AppointmentsController],
    exports: [AppointmentsService],
  })
export class AppointmentsModule {}
