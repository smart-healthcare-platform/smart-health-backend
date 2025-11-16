import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from '../modules/email/email.module';
import { FirebaseModule } from '../modules/firebase/firebase.module';
import { DeviceModule } from '../modules/device/device.module';
import { KafkaConsumerService } from './kafka-consumer.service';
import { NotificationKafkaController } from './notification-kafka.controller';

@Module({
  imports: [ConfigModule, EmailModule, FirebaseModule, DeviceModule],
  controllers: [NotificationKafkaController],
  providers: [KafkaConsumerService],
})
export class KafkaModule {}
