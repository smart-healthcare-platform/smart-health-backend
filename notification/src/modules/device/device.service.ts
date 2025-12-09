import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDevice, DeviceType } from '../../entities/user-device.entity';

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  constructor(
    @InjectRepository(UserDevice)
    private readonly deviceRepository: Repository<UserDevice>,
  ) {}

  async registerDevice(
    userId: string,
    deviceToken: string,
    deviceType: DeviceType,
  ): Promise<UserDevice> {
    try {
      // Kiểm tra xem device token đã tồn tại chưa
      const existingDevice = await this.deviceRepository.findOne({
        where: { userId, deviceToken },
      });

      if (existingDevice) {
        // Nếu đã tồn tại, cập nhật lại thành active và update timestamp
        existingDevice.isActive = true;
        existingDevice.deviceType = deviceType;
        await this.deviceRepository.save(existingDevice);
        
        this.logger.log(
          `Updated existing ${deviceType} device for user ${userId}`,
        );
        return existingDevice;
      }

      // Nếu chưa tồn tại, tạo mới
      const newDevice = this.deviceRepository.create({
        userId,
        deviceToken,
        deviceType,
        isActive: true,
      });

      await this.deviceRepository.save(newDevice);
      this.logger.log(`Registered new ${deviceType} device for user ${userId}`);
      
      return newDevice;
    } catch (error: any) {
      this.logger.error(
        `Failed to register device for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getActiveDevices(userId: string): Promise<UserDevice[]> {
    try {
      const devices = await this.deviceRepository.find({
        where: { userId, isActive: true },
      });

      this.logger.log(
        `Retrieved ${devices.length} active devices for user ${userId}`,
      );
      return devices;
    } catch (error: any) {
      this.logger.error(
        `Failed to get active devices for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getDevicesByType(
    userId: string,
    deviceType: DeviceType,
  ): Promise<UserDevice[]> {
    try {
      const devices = await this.deviceRepository.find({
        where: { userId, deviceType, isActive: true },
      });

      this.logger.log(
        `Retrieved ${devices.length} ${deviceType} devices for user ${userId}`,
      );
      return devices;
    } catch (error: any) {
      this.logger.error(
        `Failed to get ${deviceType} devices for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async deactivateDevice(
    userId: string,
    deviceToken: string,
  ): Promise<{ success: boolean }> {
    try {
      const device = await this.deviceRepository.findOne({
        where: { userId, deviceToken },
      });

      if (!device) {
        this.logger.warn(
          `Device not found for user ${userId} with provided token`,
        );
        return { success: false };
      }

      device.isActive = false;
      await this.deviceRepository.save(device);

      this.logger.log(
        `Deactivated ${device.deviceType} device for user ${userId}`,
      );
      return { success: true };
    } catch (error: any) {
      this.logger.error(
        `Failed to deactivate device for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async deactivateAllDevices(userId: string): Promise<{ success: boolean; count: number }> {
    try {
      const result = await this.deviceRepository.update(
        { userId, isActive: true },
        { isActive: false },
      );

      this.logger.log(
        `Deactivated ${result.affected || 0} devices for user ${userId}`,
      );
      
      return { success: true, count: result.affected || 0 };
    } catch (error: any) {
      this.logger.error(
        `Failed to deactivate all devices for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async cleanupInactiveDevices(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await this.deviceRepository
        .createQueryBuilder()
        .delete()
        .where('is_active = :isActive', { isActive: false })
        .andWhere('updated_at < :cutoffDate', { cutoffDate })
        .execute();

      this.logger.log(
        `Cleaned up ${result.affected || 0} inactive devices older than ${olderThanDays} days`,
      );
      
      return result.affected || 0;
    } catch (error: any) {
      this.logger.error(
        `Failed to cleanup inactive devices: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}