import { PartialType } from '@nestjs/mapped-types';
import { CreateDoctorAppoinmentSlotDto } from './create-doctor-appointment.dto';

export class UpdateDoctorAppoinmentSlotDto extends PartialType(CreateDoctorAppoinmentSlotDto) {}
