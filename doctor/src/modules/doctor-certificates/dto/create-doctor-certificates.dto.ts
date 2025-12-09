import {
  IsNotEmpty,
  IsEnum,
  IsString,
  IsInt,
  IsOptional,
  IsDateString,
  Length,
  IsUUID,
  IsBoolean,
} from 'class-validator';

import { CertificateType } from '../enums/certificate-type.enum';
import { AcademicDegree } from '../enums/academic_degree.enum';

export class CreateDoctorCertificateDto {
  @IsNotEmpty({ message: 'ID bác sĩ là bắt buộc' })
  @IsUUID('4', { message: 'ID bác sĩ không hợp lệ' })
  doctor_id: string;

  @IsNotEmpty({ message: 'Loại chứng chỉ là bắt buộc' })
  @IsEnum(CertificateType, { message: 'Loại chứng chỉ không hợp lệ' })
  type: CertificateType;

  // DEGREE ONLY
  @IsOptional()
  @IsEnum(AcademicDegree, { message: 'Học vị không hợp lệ' })
  academic_degree?: AcademicDegree;

  @IsOptional()
  @IsString({ message: 'Lĩnh vực phải là chuỗi' })
  @Length(1, 150, { message: 'Lĩnh vực không được quá 150 ký tự' })
  field?: string;

  @IsOptional()
  @IsInt({ message: 'Năm tốt nghiệp phải là số nguyên' })
  graduation_year?: number;

  // LICENSE ONLY
  @IsOptional()
  @IsString({ message: 'Số giấy phép phải là chuỗi' })
  @Length(1, 100, { message: 'Số giấy phép không được quá 100 ký tự' })
  license_number?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày cấp không hợp lệ (ISO 8601)' })
  issued_date?: Date;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày hết hạn không hợp lệ (ISO 8601)' })
  expiry_date?: Date;

  @IsOptional()
  @IsString({ message: 'Nơi cấp phải là chuỗi' })
  @Length(1, 150, { message: 'Tên nơi cấp không được quá 150 ký tự' })
  issued_by?: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Tệp chứng chỉ phải là chuỗi' })
  @Length(1, 255, { message: 'Đường dẫn tệp không được quá 255 ký tự' })
  certificate_file?: string;

  @IsOptional()
  @IsEnum(['PENDING', 'APPROVED', 'REJECTED'], {
    message: 'Trạng thái không hợp lệ',
  })
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsBoolean({ message: 'is_verified phải là boolean' })
  is_verified?: boolean;

  @IsOptional()
  @IsDateString({}, { message: 'verified_at phải đúng định dạng ISO 8601' })
  verified_at?: Date;

  @IsOptional()
  @IsString({ message: 'Thông tin người xác minh phải là chuỗi' })
  @Length(1, 100, { message: 'Tên người xác minh không được quá 100 ký tự' })
  verified_by?: string;
}
