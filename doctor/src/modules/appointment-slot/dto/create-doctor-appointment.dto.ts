import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';

export class CreateDoctorAppoinmentSlotDto {

  @IsDateString()
  start_time: string;

  @IsDateString()
  end_time: string;

  @IsOptional()
  @IsEnum(['available', 'booked', 'cancelled'])
  status?: 'available' | 'booked' | 'cancelled';

  @IsOptional()
  @IsString()
  patient_id?: string;
}
