import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentDto } from './create-appointment.dto';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { AppointmentStatus } from '../enums/appointment-status.enum';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
  
  @IsString()
  userId: string;
}
