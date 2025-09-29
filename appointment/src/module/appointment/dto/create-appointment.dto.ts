import { IsNotEmpty, IsString, IsOptional, IsDate } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  doctorId: string;
  @IsString()
  @IsNotEmpty()
  doctorName: string;

  @IsOptional()
  @IsString()
  patientId?: string; 

  @IsString()
  @IsNotEmpty()
  slotId: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  @IsNotEmpty()
  userId: string; 
  @IsDate()
  @IsNotEmpty()
  startAt: string; 
}
