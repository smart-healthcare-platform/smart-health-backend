import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { LabTestType } from "../enums/lab-test-type.enum";
import { LabTestStatus } from "../enums/lab-test-status.enum";

export class CreateLabTestOrderDto {
    @IsUUID()
    @IsNotEmpty()
    appointmentId: string;

    @IsEnum(LabTestType)
    @IsNotEmpty()
    type: LabTestType;

    @IsOptional()
    @IsEnum(LabTestStatus)
    status?: LabTestStatus;

    @IsOptional()
    @IsString()
    orderedBy?: string;

    @IsOptional()
    @IsDateString()
    performedAt?: Date;
}