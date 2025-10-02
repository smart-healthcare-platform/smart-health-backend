import {
    Entity, Column, PrimaryGeneratedColumn,
    ManyToOne, OneToMany, JoinColumn,
    CreateDateColumn, UpdateDateColumn
  } from 'typeorm';
import { Patient } from '../patient/patient.entity';
import { Prescription } from '../prescriptions/prescription.entity';
@Entity('medical_records')
export class MedicalRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Patient, patient => patient.medical_records, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ type: 'char', length: 36 })
  patient_id: string;

  @Column({ type: 'char', length: 36 })
  doctor_id: string; // từ doctor service

  @Column({ type: 'char', length: 36, nullable: true })
  appointment_id: string; // từ appointment service

  @Column({ type: 'text', nullable: true })
  diagnosis: string;

  @Column({ type: 'text', nullable: true })
  symptoms: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => Prescription, pres => pres.medical_record)
  prescriptions: Prescription[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}