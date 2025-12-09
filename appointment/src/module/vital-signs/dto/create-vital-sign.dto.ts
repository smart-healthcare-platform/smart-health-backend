import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsString,
  IsDateString,
} from 'class-validator';
import { VitalSignStatus } from '../enums/vital-sign-status.enum';

export class CreateVitalSignDto {
  @IsUUID()
  @IsNotEmpty()
  medicalRecordId: string;

  @IsUUID()
  @IsOptional()
  labTestOrderId?: string;

  // --- Chỉ số đo trực tiếp ---
  @IsOptional() @IsNumber() temperature?: number;
  @IsOptional() @IsNumber() heartRate?: number;
  @IsOptional() @IsNumber() systolicPressure?: number;
  @IsOptional() @IsNumber() diastolicPressure?: number;
  @IsOptional() @IsNumber() oxygenSaturation?: number;
  @IsOptional() @IsNumber() height?: number;
  @IsOptional() @IsNumber() weight?: number;
  @IsOptional() @IsNumber() bmi?: number;

  @IsOptional() @IsNumber() bloodSugar?: number;
  @IsOptional() @IsNumber() cholesterolTotal?: number;
  @IsOptional() @IsNumber() hdl?: number;
  @IsOptional() @IsNumber() ldl?: number;
  @IsOptional() @IsNumber() triglycerides?: number;
  @IsOptional() @IsNumber() creatinine?: number;

  @IsOptional() @IsNumber() urineProtein?: number;
  @IsOptional() @IsNumber() urinePH?: number;
  @IsOptional() @IsNumber() urineSugar?: number;

  // --- Trạng thái ---
  @IsOptional()
  @IsEnum(VitalSignStatus)
  status?: VitalSignStatus;

  // --- Metadata ---
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() recordedBy?: string;
  @IsOptional() @IsDateString() recordedAt?: Date;
}
