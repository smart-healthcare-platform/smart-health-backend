import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(8084);
  console.log('Appointment service running on port 8084');
}

bootstrap();