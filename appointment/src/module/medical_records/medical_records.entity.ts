import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { Appointment } from '../appointment/appointment.entity';
import { VitalSign } from '../vital_signs/vital_signs.entity';

@Entity('medical_records')
export class MedicalRecord {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true }) // Mỗi appointment chỉ có 1 record
    appointmentId: string;

    @Column({ type: 'text', nullable: true })
    symptoms: string; // Triệu chứng

    @Column({ type: 'text' })
    diagnosis: string; // Chẩn đoán

    @Column({ type: 'text', nullable: true })
    doctorNotes: string; // Ghi chú của bác sĩ

    @Column({ type: 'text', nullable: true })
    prescription: string; // Đơn thuốc (Lý tưởng nhất nên tách thành bảng riêng)

    @Column({ type: 'date', nullable: true })
    followUpDate: Date; // Lịch tái khám

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToOne(() => Appointment, (appointment) => appointment.medicalRecord)
    @JoinColumn({ name: 'appointmentId' })
    appointment: Appointment;

    @OneToOne(() => VitalSign, (vitalSign) => vitalSign.medicalRecord, { cascade: true })
    vitalSigns: VitalSign;
}