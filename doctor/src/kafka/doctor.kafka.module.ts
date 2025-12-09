import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DoctorProducerService } from 'src/kafka/doctor-producer.service';
import { DoctorConsumer } from 'src/kafka/production-doctor-consumer';
import { AppointmentSlotModule } from 'src/modules/appointment-slot/appointment-slot.module';
import { DoctorModule } from 'src/modules/doctor/doctor.module';
import { createKafkaConfig } from './kafka.config';

@Module({
  imports: [
    forwardRef(() => DoctorModule),
    AppointmentSlotModule,
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const { broker, clientId } = createKafkaConfig(configService);
          return {
            transport: Transport.KAFKA,
            options: {
              client: { clientId, brokers: [broker] },
            },
          };
        },
      },
    ]),
  ],
  providers: [DoctorProducerService, DoctorConsumer],
  exports: [DoctorProducerService],
})
export class DoctorKafkaModule {}
