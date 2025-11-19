import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { FirebaseModule } from './firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
