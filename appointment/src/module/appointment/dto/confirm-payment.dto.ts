import { IsOptional, IsString, IsNumber } from 'class-validator';

/**
 * DTO cho Internal API: Confirm Payment
 * Được gọi bởi Billing Service khi thanh toán thành công
 */
export class ConfirmPaymentDto {
  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;
}
