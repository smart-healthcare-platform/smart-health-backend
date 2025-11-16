import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Internal Guard
 * Verifies that requests come from API Gateway with valid internal secret
 * Used to protect admin endpoints that should only be called internally
 */
@Injectable()
export class InternalGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Check for internal request header
    const isInternalRequest = request.headers['x-internal-request'];
    if (isInternalRequest !== 'true') {
      throw new UnauthorizedException(
        'This endpoint is only accessible internally',
      );
    }

    // Verify gateway secret
    const gatewaySecret = request.headers['x-gateway-secret'];
    const expectedSecret = this.configService.get<string>('GATEWAY_SECRET');

    if (!expectedSecret) {
      throw new UnauthorizedException(
        'Gateway secret not configured in service',
      );
    }

    if (gatewaySecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid gateway secret');
    }

    return true;
  }
}