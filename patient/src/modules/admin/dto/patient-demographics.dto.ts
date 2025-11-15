import { IsArray, IsNumber, IsString } from 'class-validator';

/**
 * Age Group Distribution
 * Distribution of patients by age group
 */
export class AgeGroupDistribution {
  @IsString()
  ageGroup: string; // e.g., "0-18", "19-30", "31-45", "46-60", "60+"

  @IsNumber()
  count: number;

  @IsNumber()
  percentage: number;
}

/**
 * Gender Distribution
 * Distribution of patients by gender
 */
export class GenderDistribution {
  @IsString()
  gender: string;

  @IsNumber()
  count: number;

  @IsNumber()
  percentage: number;
}

/**
 * Patient Demographics DTO
 * Returns demographic breakdown of patients for admin dashboard
 */
export class PatientDemographicsDto {
  @IsArray()
  ageGroups: AgeGroupDistribution[];

  @IsArray()
  genders: GenderDistribution[];

  @IsNumber()
  averageAge: number;

  @IsNumber()
  medianAge: number;

  @IsNumber()
  totalPatients: number;
}