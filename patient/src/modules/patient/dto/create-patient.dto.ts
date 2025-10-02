import { IsString, IsOptional, IsDateString, IsEmail } from 'class-validator';

export class CreatePatientDto {
  @IsString()
  full_name: string;
  @IsString()
  user_id: string;
  @IsOptional()
  @IsDateString()
  date_of_birth?: Date;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
