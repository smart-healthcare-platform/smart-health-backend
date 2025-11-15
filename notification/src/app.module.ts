import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationModule } from './modules/notification.module';
import { KafkaModule } from './kafka/kafka.module';
import { EmailModule } from './modules/email/email.module';
import { FirebaseModule } from './modules/firebase/firebase.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    NotificationModule,
    KafkaModule,
    EmailModule,
    FirebaseModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
