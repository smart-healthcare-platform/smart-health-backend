// src/appointment/appointment.entity.ts

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
} from 'typeorm';
import { MedicalRecord } from '../medical_records/medical_records.entity';
import { PaymentStatus } from './enums/payment-status.enum';
import { AppointmentStatus } from './enums/appointment-status.enum';

@Entity('appointments')
export class Appointment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    doctorId: string;

    @Column()
    doctorName: string;

    @Column({ nullable: true })
    patientId: string;

    @Column({ nullable: true })
    patientName: string;

    @Column()
    slotId: string;

    @Column({
        type: 'enum',
        enum: AppointmentStatus,
        default: AppointmentStatus.PENDING,
    })
    status: AppointmentStatus;

    @Column({ nullable: true })
    type: string; // ví dụ: online, offline

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'datetime' })
    startAt: Date;

    // ============ PAYMENT FIELDS ============
    /**
     * Trạng thái thanh toán của appointment
     * Default: UNPAID khi tạo mới
     */
    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.UNPAID,
    })
    paymentStatus: PaymentStatus;

    /**
     * Mã Payment từ Billing Service
     * Được cập nhật khi tạo payment request
     */
    @Column({ nullable: true })
    paymentId: string;

    /**
     * Số tiền đã thanh toán (VNĐ)
     * Được cập nhật khi thanh toán thành công
     */
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    paidAmount: number;

    /**
     * Thời gian thanh toán thành công
     * Được cập nhật khi Billing Service confirm payment
     */
    @Column({ type: 'timestamp', nullable: true })
    paidAt: Date;

    /**
     * Thời gian check-in tại cơ sở y tế
     * Được cập nhật khi lễ tân check-in cho bệnh nhân
     */
    @Column({ type: 'timestamp', nullable: true })
    checkedInAt: Date;

    /**
     * Phí khám bệnh (VNĐ)
     * Default: 200,000 VNĐ
     */
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 200000 })
    consultationFee: number;
    // ========================================

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToOne(() => MedicalRecord, (medicalRecord) => medicalRecord.appointment)
    medicalRecord: MedicalRecord;
}