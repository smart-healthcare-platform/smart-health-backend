// src/vital_signs/vital-signs.service.ts

import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VitalSign } from './vital_signs.entity';
import { CreateVitalSignDto } from './dto/create-vital-sign.dto';
import { UpdateVitalSignDto } from './dto/update-vital-sign.dto';
import { MedicalRecord } from '../medical_records/medical_records.entity';

@Injectable()
export class VitalSignsService {
    constructor(
        @InjectRepository(VitalSign)
        private readonly vitalSignRepo: Repository<VitalSign>,

        @InjectRepository(MedicalRecord)
        private readonly medicalRecordRepo: Repository<MedicalRecord>,
    ) { }

    /**
     * Tạo một bản ghi dấu hiệu sinh tồn mới cho một hồ sơ bệnh án
     */
    async create(dto: CreateVitalSignDto): Promise<VitalSign> {
        const { medicalRecordId } = dto;

        // 1. Kiểm tra xem medical record có tồn tại không
        const medicalRecord = await this.medicalRecordRepo.findOne({
            where: { id: medicalRecordId },
        });
        if (!medicalRecord) {
            throw new NotFoundException(
                `Medical Record with ID ${medicalRecordId} not found.`,
            );
        }

        // 2. Kiểm tra xem đã có vital sign cho medical record này chưa
        const existingVitalSign = await this.vitalSignRepo.findOne({
            where: { medicalRecordId },
        });
        if (existingVitalSign) {
            throw new ConflictException(
                `Vital signs for medical record ${medicalRecordId} already exist.`,
            );
        }

        // 3. Tính toán BMI nếu có đủ thông tin
        let bmi: number | undefined = undefined;
        if (dto.height && dto.weight) {
            // Chuyển chiều cao từ cm sang m
            const heightInMeters = dto.height / 100;
            bmi = parseFloat((dto.weight / (heightInMeters * heightInMeters)).toFixed(2));
        }

        // 4. Tạo và lưu bản ghi mới
        const newVitalSign = this.vitalSignRepo.create({ ...dto, bmi });
        return this.vitalSignRepo.save(newVitalSign);
    }

    /**
     * Tìm dấu hiệu sinh tồn bằng ID của nó
     */
    async findOne(id: string): Promise<VitalSign> {
        const vitalSign = await this.vitalSignRepo.findOne({ where: { id } });
        if (!vitalSign) {
            throw new NotFoundException(`Vital Sign with ID ${id} not found.`);
        }
        return vitalSign;
    }

    /**
     * Tìm dấu hiệu sinh tồn bằng ID của Medical Record
     */
    async findByMedicalRecordId(medicalRecordId: string): Promise<VitalSign> {
        const vitalSign = await this.vitalSignRepo.findOne({
            where: { medicalRecordId },
        });
        if (!vitalSign) {
            throw new NotFoundException(
                `Vital signs for medical record ID ${medicalRecordId} not found.`,
            );
        }
        return vitalSign;
    }

    /**
     * Cập nhật dấu hiệu sinh tồn
     */
    async update(
        id: string,
        dto: UpdateVitalSignDto,
    ): Promise<VitalSign> {
        const existingVitalSign = await this.findOne(id);

        // Tính lại BMI nếu height hoặc weight thay đổi
        const newHeight = dto.height ?? existingVitalSign.height;
        const newWeight = dto.weight ?? existingVitalSign.weight;
        let bmi: number | undefined = existingVitalSign.bmi;

        if (newHeight && newWeight) {
            const heightInMeters = newHeight / 100;
            bmi = parseFloat((newWeight / (heightInMeters * heightInMeters)).toFixed(2));
        }

        const updatedVitalSign = await this.vitalSignRepo.preload({
            id: id,
            ...dto,
            bmi,
        });

        if (!updatedVitalSign) {
            throw new NotFoundException(`Vital Sign with ID ${id} not found.`);
        }

        return this.vitalSignRepo.save(updatedVitalSign);
    }

    /**
     * Xóa một bản ghi dấu hiệu sinh tồn
     */
    async remove(id: string): Promise<void> {
        const result = await this.vitalSignRepo.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Vital Sign with ID ${id} not found.`);
        }
    }
}