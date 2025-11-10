import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { LabTestType } from "../enums/lab-test-type.enum";
import { LabTestOrderStatus } from "../enums/lab-test-order-status.enum";

export class CreateLabTestOrderDto {
    @IsUUID()
    @IsNotEmpty()
    appointmentId: string;

    @IsEnum(LabTestType)
    @IsNotEmpty()
    type: LabTestType;

    @IsOptional()
    @IsEnum(LabTestOrderStatus)
    status?: LabTestOrderStatus;

    @IsOptional()
    @IsString()
    orderedBy?: string;
}