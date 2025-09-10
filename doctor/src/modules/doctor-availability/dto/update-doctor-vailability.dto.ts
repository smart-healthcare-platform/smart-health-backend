import { PartialType } from '@nestjs/mapped-types';
import { CreateDoctorAvailabilityDto } from './create-doctor-vailability.dto';

export class UpdateDoctorAvailabilityDto extends PartialType(CreateDoctorAvailabilityDto) {}
