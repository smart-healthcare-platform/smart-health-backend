import { PartialType } from '@nestjs/mapped-types';
import { CreateDoctorDegreeDto } from './create-doctor-degree.dto';

export class UpdateDoctorDegreeDto extends PartialType(CreateDoctorDegreeDto) {}
