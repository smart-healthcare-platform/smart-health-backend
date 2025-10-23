import { IsString, IsEnum } from 'class-validator';

/**
 * DTO cho việc tạo payment request
 */
export class CreatePaymentRequestDto {
  @IsString()
  @IsEnum(['MOMO', 'VNPAY'])
  paymentMethod: 'MOMO' | 'VNPAY';
}
