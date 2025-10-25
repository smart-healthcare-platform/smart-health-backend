import { forwardRef, Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { createKafkaConfig } from './kafka.config';
import { AppointmentProducerService } from './appointment-producer.service';
import { ProductionAppointmentConsumer } from './production-appointment-consumer.service';
import { AppointmentsModule } from 'src/module/appointment/appointment.module';

@Global()
@Module({
  imports: [
    forwardRef(() => AppointmentsModule),
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const { broker, clientId } = createKafkaConfig(configService);
          return {
            transport: Transport.KAFKA,
            options: { client: { clientId, brokers: [broker] } },
          };
        },
      },
    ]),
  ],
  providers: [AppointmentProducerService, ProductionAppointmentConsumer],
  exports: [AppointmentProducerService, ProductionAppointmentConsumer],
})
export class KafkaModule {}
