import { IsArray, IsNumber, IsString, IsDateString, IsOptional } from 'class-validator';

/**
 * Recent Patient Item
 * Single patient item in recent patients list
 */
export class RecentPatientItem {
  @IsString()
  id: string;

  @IsString()
  user_id: string;

  @IsString()
  full_name: string;

  @IsDateString()
  @IsOptional()
  date_of_birth?: Date;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsDateString()
  created_at: Date;

  @IsDateString()
  updated_at: Date;
}

/**
 * Recent Patients DTO
 * Returns paginated list of recently registered patients
 */
export class RecentPatientsDto {
  @IsArray()
  patients: RecentPatientItem[];

  @IsNumber()
  total: number;

  @IsNumber()
  page: number;

  @IsNumber()
  limit: number;

  @IsNumber()
  totalPages: number;
}