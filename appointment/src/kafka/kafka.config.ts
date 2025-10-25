import { ConfigService } from '@nestjs/config';

export const createKafkaConfig = (configService: ConfigService) => {
  const broker =
    configService.get<string>('KAFKA_BROKER') ||
    process.env.KAFKA_BROKER ||
    'localhost:9092';

  const clientId =
    configService.get<string>('KAFKA_CLIENT_ID') || 'appointment-service';

  return {
    broker,
    clientId,
  };
};
