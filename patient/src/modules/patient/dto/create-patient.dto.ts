import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { Gender } from '../enums/patient-gender.enum';

export class CreatePatientDto {
  @IsString()
  full_name: string;

  @IsString()
  user_id: string;

  @IsOptional()
  @IsDateString()
  date_of_birth: Date;

  @IsOptional()
  @IsEnum(Gender, { message: 'gender must be one of: male, female, other' })
  gender: Gender;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  phone: string;
}
