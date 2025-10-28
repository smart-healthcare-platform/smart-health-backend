import {
    IsString,
    IsNotEmpty,
    IsUUID,
    IsOptional,
    IsDateString,
} from 'class-validator';

export class CreateMedicalRecordDto {
    @IsUUID()
    @IsNotEmpty()
    appointmentId: string;

    @IsString()
    @IsNotEmpty()
    diagnosis: string;

    @IsString()
    @IsOptional()
    symptoms?: string;

    @IsString()
    @IsOptional()
    doctorNotes?: string;

    @IsString()
    @IsOptional()
    prescription?: string;

}