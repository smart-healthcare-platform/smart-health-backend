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

    @Column({ default: 'pending' })
    status: string; // ví dụ: pending, confirmed, completed, cancelled

    @Column({ nullable: true })
    type: string; // ví dụ: online, offline

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'datetime' })
    startAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToOne(() => MedicalRecord, (medicalRecord) => medicalRecord.appointment)
    medicalRecord: MedicalRecord;
}