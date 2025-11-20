import { IsString, IsEmail, IsEnum, IsOptional, IsDateString, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { Gender } from '../enums/doctor-gender.enum';

export class CreateDoctorDto {
  @IsString()
  user_id: string;

  @IsString()
  full_name: string;

  @IsOptional()
  @IsEnum(Gender, { message: 'gender must be one of: male, female, other' })
  gender: Gender;

  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  phone: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  experience_years?: number;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;


}
