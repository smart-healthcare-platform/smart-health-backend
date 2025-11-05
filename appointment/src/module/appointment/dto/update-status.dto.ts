import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { AppointmentStatus } from '../enums/appointment-status.enum';

/**
 * DTO để cập nhật status của appointment (cho Receptionist/Doctor)
 */
export class UpdateAppointmentStatusDto {
  @IsNotEmpty()
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
