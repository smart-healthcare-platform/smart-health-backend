import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';

export class CreateDoctorRatingDto {
  @IsString()
  doctor_id: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  patient_id?: string;
}
