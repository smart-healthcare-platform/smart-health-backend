import { Controller, Post, Delete, Body, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceType } from '../../entities/user-device.entity';

class RegisterDeviceDto {
  userId: string;
  deviceToken: string;
  deviceType: DeviceType;
}

class DeactivateDeviceDto {
  userId: string;
  deviceToken: string;
}

@Controller('device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registerDevice(@Body() dto: RegisterDeviceDto) {
    const device = await this.deviceService.registerDevice(
      dto.userId,
      dto.deviceToken,
      dto.deviceType,
    );

    return {
      success: true,
      message: 'Device registered successfully',
      data: {
        id: device.id,
        userId: device.userId,
        deviceType: device.deviceType,
        isActive: device.isActive,
      },
    };
  }

  @Get(':userId/devices')
  async getActiveDevices(@Param('userId') userId: string) {
    const devices = await this.deviceService.getActiveDevices(userId);

    return {
      success: true,
      message: 'Active devices retrieved successfully',
      data: devices.map((device) => ({
        id: device.id,
        deviceType: device.deviceType,
        isActive: device.isActive,
        createdAt: device.createdAt,
      })),
    };
  }

  @Get(':userId/devices/:deviceType')
  async getDevicesByType(
    @Param('userId') userId: string,
    @Param('deviceType') deviceType: DeviceType,
  ) {
    const devices = await this.deviceService.getDevicesByType(userId, deviceType);

    return {
      success: true,
      message: `${deviceType} devices retrieved successfully`,
      data: devices.map((device) => ({
        id: device.id,
        deviceType: device.deviceType,
        isActive: device.isActive,
        createdAt: device.createdAt,
      })),
    };
  }

  @Delete('deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivateDevice(@Body() dto: DeactivateDeviceDto) {
    const result = await this.deviceService.deactivateDevice(
      dto.userId,
      dto.deviceToken,
    );

    return {
      success: result.success,
      message: result.success
        ? 'Device deactivated successfully'
        : 'Device not found',
    };
  }

  @Delete(':userId/all')
  @HttpCode(HttpStatus.OK)
  async deactivateAllDevices(@Param('userId') userId: string) {
    const result = await this.deviceService.deactivateAllDevices(userId);

    return {
      success: result.success,
      message: `Deactivated ${result.count} device(s)`,
      data: { count: result.count },
    };
  }
}