import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DoctorProducerService } from 'src/kafka/doctor-producer.service';
import { DoctorConsumer } from 'src/kafka/production-doctor-consumer';
import { AppointmentSlotModule } from 'src/modules/appointment-slot/appointment-slot.module';
import { DoctorModule } from 'src/modules/doctor/doctor.module';

@Module({
  imports: [
    AppointmentSlotModule,
    DoctorModule,
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'doctor-service',
            brokers: ['localhost:9092'],
          },
        },
      },
    ]),
  ],
  providers: [DoctorProducerService, DoctorConsumer],
})
export class DoctorKafkaModule {}
