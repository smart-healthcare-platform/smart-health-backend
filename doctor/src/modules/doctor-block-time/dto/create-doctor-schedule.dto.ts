import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export class CreateDoctorScheduleDto {
  @IsString()
  doctor_id: string;

  @IsEnum(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])
  day_of_week: string;

  @IsString()
  start_time: string; // 'HH:MM:SS'

  @IsString()
  end_time: string;

  @IsOptional()
  @IsBoolean()
  is_available?: boolean;
}
