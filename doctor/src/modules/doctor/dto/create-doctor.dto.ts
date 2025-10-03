import { IsString, IsEmail, IsEnum, IsOptional, IsDateString, IsInt, Min, Max, IsBoolean } from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  user_id: string;

  @IsString()
  full_name: string;

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
