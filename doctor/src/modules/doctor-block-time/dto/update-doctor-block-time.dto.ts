import { PartialType } from '@nestjs/mapped-types';
import { CreateDoctorBlockTimeDto } from './create-doctor-block-time.dto';

export class UpdateDoctorBlockTimeDto extends PartialType(CreateDoctorBlockTimeDto) {}
