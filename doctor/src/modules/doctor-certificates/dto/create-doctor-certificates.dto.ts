import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateDoctorLicenseDto {
  @IsString()
  license_number: string;

  @IsOptional()
  @IsDateString()
  issued_date?: string;

  @IsOptional()
  @IsDateString()
  expiry_date?: string;

  @IsOptional()
  @IsString()
  certificate_file?: string;

  @IsString()
  doctor_id: string;
}
