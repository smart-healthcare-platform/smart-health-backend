import { PartialType } from '@nestjs/mapped-types';
import { CreateDoctorRatingDto } from './create-doctor-rating.dto';

export class UpdateDoctorRatingDto extends PartialType(CreateDoctorRatingDto) {}
