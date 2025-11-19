import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { UserDevice } from '../../entities/user-device.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserDevice])],
  controllers: [DeviceController],
  providers: [DeviceService],
  exports: [DeviceService],
})
export class DeviceModule {}