import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: (configService.get<string>('NODE_ENV') === 'test'
          ? configService.get<string>('KAFKA_BROKERS_E2E') || 'localhost:9092'
          : configService.get<string>('KAFKA_BROKERS') || 'localhost:9092'
        ).split(','),
      },
      consumer: {
        groupId: 'notification-service-group',
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(configService.get('PORT') || 8088);
  console.log(
    `Notification service running on port ${configService.get('PORT') || 8088}`,
  );
}
bootstrap();
