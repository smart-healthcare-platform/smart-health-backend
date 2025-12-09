import { IsNumber, IsString, IsOptional } from 'class-validator';

export class DoctorStatsDto {
  @IsNumber()
  totalDoctors: number;


  @IsNumber()
  newDoctorsThisMonth: number;

  @IsNumber()
  newDoctorsThisWeek: number;

  @IsNumber()
  doctorsWorkingToday: number;

  @IsNumber()
  averageRating: number;

  @IsNumber()
  totalRatings: number;

  @IsNumber()
  totalAppointmentSlots: number;

  @IsNumber()
  bookedSlotsThisMonth: number;

  @IsString()
  @IsOptional()
  mostPopularSpecialty?: string;

  @IsNumber()
  @IsOptional()
  doctorsInMostPopularSpecialty?: number;

  @IsNumber()
  averageExperienceYears: number;

  @IsNumber()
  doctorsWithCertificates: number;
}