import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // No microservice needed - using raw Kafka consumer
  await app.listen(8083);
  console.log('Doctor service running on port 8083');
}

bootstrap();