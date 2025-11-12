// create-lab-test-result.dto.ts
import { IsOptional, IsUUID, IsEnum, IsString, IsNumber } from 'class-validator';
import { LabResultStatus } from '../enums/lab-test-result-status.enum';

export class CreateLabTestResultDto {
  @IsUUID()
  labTestOrderId: string;

  @IsOptional() @IsString() resultFile?: string;
  @IsOptional() @IsString() summary?: string;
  @IsOptional() @IsString() enteredBy?: string;

  @IsOptional() bloodSugar?: number;
  @IsOptional() cholesterolTotal?: number;
  @IsOptional() hdl?: number;
  @IsOptional() ldl?: number;
  @IsOptional() triglycerides?: number;
  @IsOptional() creatinine?: number;
  @IsOptional() urineProtein?: number;
  @IsOptional() urinePH?: number;
  @IsOptional() urineSugar?: number;
}

