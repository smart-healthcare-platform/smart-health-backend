import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointment.controller';
import { Appointment } from './appointment.entity';
import { AppointmentProducerService } from './appointment-producer.service';
import { ProductionAppointmentConsumer } from './production-appointment-consumer.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment]),
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: { 
            clientId: 'appointment-service-producer', 
            brokers: ['localhost:9092'] 
          },
          producerOnlyMode: true,
        },
      },
    ]),
  ],
  providers: [
    AppointmentsService, 
    AppointmentProducerService, 
    ProductionAppointmentConsumer, 
  ],
  controllers: [AppointmentsController],
  exports: [AppointmentsService],
})
export class AppointmentsModule { }