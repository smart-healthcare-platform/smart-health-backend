import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { createKafkaConfig } from './kafka.config';
import { PatientModule } from 'src/modules/patient/patient.module';
import { PatientConsumerService } from './production-patient-consumer';
import { PatientProducerService } from './patient-producer.service';

@Module({
  imports: [
    PatientModule,
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const { broker, clientId } = createKafkaConfig(configService);

          return {
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId,
                brokers: [broker],
              },
            },
          };
        },
      },
    ]),
  ],
  providers: [PatientConsumerService,PatientProducerService],
})
export class PatientKafkaModule {}
