import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
} from 'class-validator';

/**
 * DTO for creating walk-in appointment by receptionist
 * Used when patient comes directly without prior online booking
 */
export class CreateWalkInAppointmentDto {
  @IsUUID()
  @IsNotEmpty({ message: 'Patient ID không được để trống' })
  patientId: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên bệnh nhân không được để trống' })
  patientName: string;

  @IsUUID()
  @IsNotEmpty({ message: 'Doctor ID không được để trống' })
  doctorId: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên bác sĩ không được để trống' })
  doctorName: string;

  @IsUUID()
  @IsNotEmpty({ message: 'Slot ID không được để trống' })
  slotId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  receptionistNotes?: string; // Ghi chú riêng của lễ tân
}
