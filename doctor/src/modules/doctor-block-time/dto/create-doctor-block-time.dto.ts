import { IsDateString, IsOptional, IsString } from "class-validator";

export class CreateDoctorBlockTimeDto {

  @IsDateString()
  start_time: string; // ISO datetime string, ví dụ: "2025-09-10T12:00:00Z"

  @IsDateString()
  end_time: string; // ISO datetime string, ví dụ: "2025-09-10T13:00:00Z"

  @IsOptional()
  @IsString()
  reason?: string; // Lý do nghỉ, ví dụ: "Nghỉ trưa", "Họp khoa", "Khám tại phòng khác"
}