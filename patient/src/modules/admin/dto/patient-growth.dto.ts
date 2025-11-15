import { IsArray, IsString, IsNumber, IsDateString } from 'class-validator';

/**
 * Patient Growth Data Point
 * Single data point in growth trend
 */
export class GrowthDataPoint {
  @IsDateString()
  date: string;

  @IsNumber()
  count: number;

  @IsNumber()
  cumulative: number;
}

/**
 * Patient Growth DTO
 * Returns patient growth trends over time for charts
 */
export class PatientGrowthDto {
  @IsString()
  period: 'daily' | 'weekly' | 'monthly';

  @IsArray()
  data: GrowthDataPoint[];

  @IsNumber()
  totalGrowth: number;

  @IsNumber()
  percentageChange: number;
}