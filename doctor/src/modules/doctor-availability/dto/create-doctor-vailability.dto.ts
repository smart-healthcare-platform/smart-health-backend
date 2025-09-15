import { IsEnum } from 'class-validator';

export class CreateDoctorAvailabilityDto {
  @IsEnum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
  day_of_week: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

  @IsEnum(['morning', 'afternoon', 'full'])
  shift: 'morning' | 'afternoon' | 'full';
}