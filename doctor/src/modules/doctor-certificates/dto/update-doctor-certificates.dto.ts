import { PartialType } from '@nestjs/mapped-types';
import { CreateDoctorLicenseDto } from './create-doctor-certificates.dto';

export class UpdateDoctorLicenseDto extends PartialType(CreateDoctorLicenseDto) {}
