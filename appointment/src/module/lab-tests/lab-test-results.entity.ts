import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { LabTestOrder } from './lab-test-order.entity';
import { MedicalRecord } from '../medical-records/medical-records.entity';
import { LabResultStatus } from './enums/lab-test-result-status.enum';

@Entity('lab-test-results')
export class LabTestResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => LabTestOrder, (order) => order.result)
  labTestOrder: LabTestOrder;

  @Column({ nullable: true }) resultFile?: string;
  @Column({ type: 'text', nullable: true }) summary?: string;
  @Column({ nullable: true }) enteredBy?: string;

  // --- Các chỉ số ---
  @Column('float', { nullable: true }) bloodSugar?: number;
  @Column('float', { nullable: true }) cholesterolTotal?: number;
  @Column('float', { nullable: true }) hdl?: number;
  @Column('float', { nullable: true }) ldl?: number;
  @Column('float', { nullable: true }) triglycerides?: number;
  @Column('float', { nullable: true }) creatinine?: number;
  @Column('float', { nullable: true }) urineProtein?: number;
  @Column('float', { nullable: true }) urinePH?: number;
  @Column('float', { nullable: true }) urineSugar?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


