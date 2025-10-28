import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator'

export class CreateFollowUpSuggestionDto {
  @IsUUID()
  @IsNotEmpty()
  medicalRecordId: string

  @IsUUID()
  @IsNotEmpty()
  doctorId: string

  @IsUUID()
  @IsNotEmpty()
  patientId: string

  @IsOptional()
  @IsDateString()
  suggestedDate?: string

  @IsOptional()
  @IsString()
  reason?: string
}
