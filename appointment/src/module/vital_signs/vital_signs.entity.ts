import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { MedicalRecord } from '../medical_records/medical_records.entity';

export enum VitalSignStatus {
  WAITING_FOR_TEST_RESULT = 'waiting_for_test_result',
  COMPLETED = 'completed',
}

@Entity({ name: 'vital_signs' })
export class VitalSign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => MedicalRecord, (record) => record.vitalSigns, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'medical_record_id' })
  medicalRecord: MedicalRecord;

  @Column({ name: 'medical_record_id' })
  medicalRecordId: string;

  // --- Chỉ số đo trực tiếp ---
  @Column('float', { nullable: true })
  temperature?: number; // °C

  @Column('float', { nullable: true })
  heartRate?: number; // bpm

  @Column('float', { nullable: true })
  systolicPressure?: number; // mmHg

  @Column('float', { nullable: true })
  diastolicPressure?: number; // mmHg

  @Column('float', { nullable: true })
  oxygenSaturation?: number; // SpO₂ %

  @Column('float', { nullable: true })
  height?: number; // cm

  @Column('float', { nullable: true })
  weight?: number; // kg

  @Column('float', { nullable: true })
  bmi?: number; // kg/m²

  // --- Một số chỉ số xét nghiệm liên quan tim mạch ---
  @Column('float', { nullable: true })
  bloodSugar?: number; // mg/dL

  @Column('float', { nullable: true })
  cholesterolTotal?: number; // mg/dL

  @Column('float', { nullable: true })
  hdl?: number; // HDL Cholesterol

  @Column('float', { nullable: true })
  ldl?: number; // LDL Cholesterol

  @Column('float', { nullable: true })
  triglycerides?: number; // mg/dL

  @Column('float', { nullable: true })
  creatinine?: number; // mg/dL

  // --- Trạng thái ---
  @Column({
    type: 'enum',
    enum: VitalSignStatus,
  })
  status: VitalSignStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
