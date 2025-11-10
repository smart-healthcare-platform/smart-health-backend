import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDate,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentType } from '../enums/appointment-type.enum';
import { AppointmentCategory } from '../enums/appointment-category.enum';

export class CreateAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @IsString()
  @IsNotEmpty()
  doctorName: string;

  @IsOptional()
  @IsUUID()
  patientId: string;

  @IsUUID()
  @IsNotEmpty()
  slotId: string;

  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType = AppointmentType.OFFLINE;

  @IsOptional()
  @IsEnum(AppointmentCategory)
  category?: AppointmentCategory = AppointmentCategory.NEW;

  @IsOptional()
  @IsString()
  notes?: string;

  /** 
   * Nếu cuộc hẹn này được tạo từ đề xuất tái khám (FollowUpSuggestion)
   * → followUpId tương ứng 
   */
  @IsOptional()
  @IsUUID()
  followUpId?: string;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  startAt: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endAt?: Date;
}
