import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Guard bảo vệ Internal API endpoints
 * Chỉ cho phép các service nội bộ gọi (như Billing Service)
 * Yêu cầu header: X-Internal-Secret
 */
@Injectable()
export class InternalApiGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-internal-secret'];
    const expectedKey = this.configService.get<string>(
      'INTERNAL_API_SECRET_KEY',
    );

    if (!apiKey || apiKey !== expectedKey) {
      throw new UnauthorizedException(
        'Invalid or missing internal API key. Access denied.',
      );
    }

    return true;
  }
}
