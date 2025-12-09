import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  private readonly startTime: Date;

  constructor() {
    this.startTime = new Date();
  }

  @Get('health')
  getHealth() {
    const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'patient-service',
      uptime: uptime,
      uptimeHuman: this.formatUptime(uptime),
      version: '1.0.0',
    };
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
  }
}