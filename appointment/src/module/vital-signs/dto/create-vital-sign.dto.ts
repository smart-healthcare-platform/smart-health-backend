import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsString,
} from 'class-validator';
import { VitalSignStatus } from '../enums/vital-sign-status.enum';

export class CreateVitalSignDto {
  @IsUUID()
  @IsNotEmpty()
  medicalRecordId: string;

  // --- Chỉ số cơ bản ---
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(30)
  @Max(45)
  temperature?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(30)
  @Max(200)
  heartRate?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(50)
  @Max(250)
  systolicPressure?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(30)
  @Max(150)
  diastolicPressure?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(70)
  @Max(100)
  oxygenSaturation?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(50)
  @Max(250)
  height?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(20)
  @Max(200)
  weight?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(10)
  @Max(60)
  bmi?: number;

  // --- Chỉ số xét nghiệm ---
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(40)
  @Max(500)
  bloodSugar?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(50)
  @Max(400)
  cholesterolTotal?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(10)
  @Max(150)
  hdl?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(10)
  @Max(250)
  ldl?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(30)
  @Max(500)
  triglycerides?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  @Max(10)
  creatinine?: number;

  // --- Trạng thái & ghi chú ---
  @IsOptional()
  @IsEnum(VitalSignStatus)
  status?: VitalSignStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
