import { IsNumber, IsString, IsUUID, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class TopDoctorDto {
  @IsUUID()
  id: string;

  @IsString()
  fullName: string;

  @IsNumber()
  experienceYears: number;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsNumber()
  averageRating: number;

  @IsNumber()
  totalRatings: number;

  @IsNumber()
  totalAppointments: number;

  @IsNumber()
  completedAppointments: number;

  @IsNumber()
  @IsOptional()
  totalRevenue?: number;
}

export class TopDoctorsResponseDto {
  @Type(() => TopDoctorDto)
  topByRating: TopDoctorDto[];

  @Type(() => TopDoctorDto)
  topByAppointments: TopDoctorDto[];

  @Type(() => TopDoctorDto)
  topByRevenue: TopDoctorDto[];
}

// export class SpecialtyPerformanceDto {
//   @IsString()
//   specialty: string;

//   @IsNumber()
//   totalDoctors: number;

//   @IsNumber()
//   activeDoctors: number;

//   @IsNumber()
//   averageRating: number;

//   @IsNumber()
//   totalAppointments: number;

//   @IsNumber()
//   totalRevenue: number;

//   @IsNumber()
//   averageExperienceYears: number;
// }

// export class DepartmentPerformanceResponseDto {
//   @Type(() => SpecialtyPerformanceDto)
//   specialties: SpecialtyPerformanceDto[];

//   @IsString()
//   topSpecialty: string;

//   @IsNumber()
//   totalSpecialties: number;
// }