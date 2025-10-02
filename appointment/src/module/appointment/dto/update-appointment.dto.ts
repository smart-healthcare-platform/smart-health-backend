import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentDto } from './create-appointment.dto';
import { IsString, IsOptional } from 'class-validator';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  @IsOptional()
  @IsString()
  status?: string; // pending, confirmed, cancelled, completed
  @IsString()
  userId: string;
}
