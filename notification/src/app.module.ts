import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationModule } from './modules/notification.module';
import { KafkaModule } from './kafka/kafka.module';
import { EmailModule } from './modules/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    NotificationModule,
    KafkaModule,
    EmailModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
