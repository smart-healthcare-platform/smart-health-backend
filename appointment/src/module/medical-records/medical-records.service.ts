import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalRecord } from './medical-records.entity';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { Appointment } from '../appointment/appointment.entity';
import { AppointmentStatus } from '../appointment/enums/appointment-status.enum';

@Injectable()
export class MedicalRecordsService {
    constructor(
        @InjectRepository(MedicalRecord)
        private readonly medicalRecordRepo: Repository<MedicalRecord>,
        @InjectRepository(Appointment)
        private readonly appointmentRepo: Repository<Appointment>,
    ) { }

    /**
     * Tạo một hồ sơ bệnh án mới cho một cuộc hẹn
     */
    async create(dto: CreateMedicalRecordDto): Promise<MedicalRecord> {
        const { appointmentId } = dto;

        const appointment = await this.appointmentRepo.findOne({
            where: { id: appointmentId },
        });
        if (!appointment) {
            throw new NotFoundException(
                `Appointment with ID ${appointmentId} not found.`,
            );
        }

        const existingRecord = await this.medicalRecordRepo.findOne({
            where: { appointment: { id: appointmentId } },
        });
        if (existingRecord) {
            throw new ConflictException(
                `Medical record for appointment ${appointmentId} already exists.`,
            );
        }

        const newRecord = this.medicalRecordRepo.create({
            diagnosis: dto.diagnosis,
            symptoms: dto.symptoms,
            doctorNotes: dto.doctorNotes,
            prescription: dto.prescription,
            appointment, // gán quan hệ OneToOne thay vì appointmentId
        });

        const savedRecord = await this.medicalRecordRepo.save(newRecord);

        appointment.status = AppointmentStatus.COMPLETED;
        await this.appointmentRepo.save(appointment);

        return savedRecord;
    }

    /**
     * Lấy tất cả hồ sơ bệnh án (có thể thêm phân trang sau)
     */
    async findAll(): Promise<MedicalRecord[]> {
        return this.medicalRecordRepo.find({
            relations: ['appointment'], // Lấy kèm thông tin cuộc hẹn
        });
    }

    /**
     * Tìm một hồ sơ bệnh án bằng ID
     */
    async findOne(id: string): Promise<MedicalRecord> {
        const record = await this.medicalRecordRepo.findOne({
            where: { id },
            relations: ['appointment', 'vitalSign'], // Lấy kèm cả thông tin sinh hiệu
        });

        if (!record) {
            throw new NotFoundException(`Medical Record with ID ${id} not found.`);
        }
        return record;
    }

    /**
     * Tìm hồ sơ bệnh án dựa trên appointmentId
     */
    async findByAppointmentId(appointmentId: string): Promise<MedicalRecord> {
        const record = await this.medicalRecordRepo.findOne({
            where: { appointment: { id: appointmentId } },
            relations: ['appointment', 'vitalSigns'],
        });

        if (!record) {
            throw new NotFoundException(
                `Medical Record for appointment ID ${appointmentId} not found.`,
            );
        }
        return record;
    }

    /**
     * Cập nhật thông tin hồ sơ bệnh án
     */
    async update(
        id: string,
        dto: UpdateMedicalRecordDto,
    ): Promise<MedicalRecord> {
        // Preload giúp lấy entity hiện có và hợp nhất các thay đổi từ DTO
        const record = await this.medicalRecordRepo.preload({
            id: id,
            ...dto,
        });

        if (!record) {
            throw new NotFoundException(`Medical Record with ID ${id} not found.`);
        }

        return this.medicalRecordRepo.save(record);
    }

    /**
     * Xóa một hồ sơ bệnh án
     */
    async remove(id: string): Promise<void> {
        const result = await this.medicalRecordRepo.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Medical Record with ID ${id} not found.`);
        }
    }
}