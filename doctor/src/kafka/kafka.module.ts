import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: { clientId: 'doctor-service-producer', brokers: ['localhost:9092'] },
          consumer: { groupId: 'doctor-producer-consumer' }, 
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class KafkaModule {}
