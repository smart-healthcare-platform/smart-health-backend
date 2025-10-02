import { IsString, IsEmail, IsEnum, IsOptional, IsDateString, IsInt, Min, Max, IsBoolean } from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  userId: string;
  @IsString()
  full_name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(['male', 'female', 'other'])
  gender?: string;

  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsString()
  specialty: string;

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
