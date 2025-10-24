import { IsOptional, IsString } from 'class-validator';

/**
 * DTO cho check-in appointment
 * Có thể mở rộng thêm fields như QR code, verification token, etc.
 */
export class CheckInDto {
  @IsOptional()
  @IsString()
  notes?: string; // Ghi chú khi check-in (optional)
}
