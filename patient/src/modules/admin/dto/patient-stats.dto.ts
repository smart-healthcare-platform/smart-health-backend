import { IsNumber, IsString, IsOptional } from 'class-validator';

/**
 * Patient Statistics DTO
 * Returns overall statistics about patients for admin dashboard
 */
export class PatientStatsDto {
  @IsNumber()
  totalPatients: number;

  @IsNumber()
  activePatients: number;

  @IsNumber()
  newThisMonth: number;

  @IsNumber()
  newThisWeek: number;

  @IsNumber()
  growthRate: number; // Percentage growth compared to last month

  @IsNumber()
  @IsOptional()
  averageAge?: number;

  @IsString()
  @IsOptional()
  mostCommonGender?: string;

  @IsNumber()
  @IsOptional()
  maleCount?: number;

  @IsNumber()
  @IsOptional()
  femaleCount?: number;

  @IsNumber()
  @IsOptional()
  otherGenderCount?: number;
}