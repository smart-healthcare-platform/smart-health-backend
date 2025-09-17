import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentSlotService } from './appointment-slot.service';
import { AppointmentSlotController } from './appointment-slot.controller';
import { AppointmentSlot } from './appointment-slot.entity';
import { Doctor } from '../doctor/doctor.entity';
import { AppointmentSlotProducerService } from './appointment-slot-producer.service';
import { ProductionAppointmentSlotConsumer } from './production-appointment-slot-consumer';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppointmentSlot, Doctor]),
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'doctor-service-producer',
            brokers: ['localhost:9092'],
          },
          producerOnlyMode: true,
        },
      },
    ]),
  ],
  providers: [
    AppointmentSlotService, 
    AppointmentSlotProducerService,
    ProductionAppointmentSlotConsumer, 
  ],
  controllers: [AppointmentSlotController],
  exports: [AppointmentSlotService],
})
export class AppointmentSlotModule { }