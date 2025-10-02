import {
    Entity, Column, PrimaryGeneratedColumn,
    ManyToOne, OneToMany, JoinColumn,
    CreateDateColumn, UpdateDateColumn
  } from 'typeorm';
import { MedicalRecord } from '../medical-records/medical-records.entity';
import { PrescriptionItem } from '../precription-items/precription-item.entity';
@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MedicalRecord, record => record.prescriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medical_record_id' })
  medical_record: MedicalRecord;

  @Column({ type: 'char', length: 36 })
  medical_record_id: string;

  @Column({ type: 'char', length: 36 })
  doctor_id: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => PrescriptionItem, item => item.prescription)
  items: PrescriptionItem[];

  @CreateDateColumn()
  created_at: Date;
}