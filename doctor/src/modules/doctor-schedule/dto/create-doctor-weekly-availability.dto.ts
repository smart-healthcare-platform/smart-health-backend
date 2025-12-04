
import { IsNotEmpty, IsEnum, IsString, IsUUID, Matches } from 'class-validator';

export enum DayOfWeek {
  MON = 'MON',
  TUE = 'TUE',
  WED = 'WED',
  THU = 'THU',
  FRI = 'FRI',
  SAT = 'SAT',
  SUN = 'SUN',
}

export class CreateDoctorWeeklyAvailabilityDto {

  @IsNotEmpty({ message: 'Ngày trong tuần là bắt buộc' })
  @IsEnum(DayOfWeek, { message: 'Ngày trong tuần không hợp lệ (chỉ chấp nhận mon, tue, wed, thu, fri, sat, sun)' })
  day_of_week: DayOfWeek;

  @IsNotEmpty({ message: 'Giờ bắt đầu là bắt buộc' })
  @IsString({ message: 'Giờ bắt đầu phải là chuỗi' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, { message: 'Giờ bắt đầu không hợp lệ (cần định dạng HH:MM:SS hoặc HH:MM)' })
  start_time: string;

  @IsNotEmpty({ message: 'Giờ kết thúc là bắt buộc' })
  @IsString({ message: 'Giờ kết thúc phải là chuỗi' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, { message: 'Giờ kết thúc không hợp lệ (cần định dạng HH:MM:SS hoặc HH:MM)' })
  end_time: string;
}
export class UpsertDoctorWeeklyAvailabilityDto {
  weekly: CreateDoctorWeeklyAvailabilityDto[];
}