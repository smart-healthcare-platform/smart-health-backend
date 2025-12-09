import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { LabTestType } from '../enums/lab-test-type.enum';

export class CreateLabTestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsEnum(LabTestType)
  @IsNotEmpty()
  type: LabTestType;

  @IsOptional()
  isActive?: boolean;
}
