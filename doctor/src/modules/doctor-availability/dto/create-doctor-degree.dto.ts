import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateDoctorDegreeDto {
  @IsString()
  degree: string;

  @IsString()
  field: string;

  @IsOptional()
  @IsString()
  university?: string;

  @IsOptional()
  @IsDateString()
  graduation_year?: string;

  @IsOptional()
  @IsString()
  certificate_file?: string;

  @IsString()
  doctor_id: string; // liên kết doctor
}
