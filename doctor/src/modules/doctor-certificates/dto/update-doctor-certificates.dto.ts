import { PartialType } from '@nestjs/mapped-types';
import { CreateDoctorCertificateDto } from './create-doctor-certificates.dto';

export class UpdateDoctorLicenseDto extends PartialType(CreateDoctorCertificateDto) {}
