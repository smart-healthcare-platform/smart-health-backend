import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LabTestOrder } from './lab-test-order.entity';
import { MedicalRecord } from '../medical-records/medical-records.entity';
import { LabResultStatus } from './enums/lab-result-status.enum';

@Entity('lab-test-results')
export class LabTestResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LabTestOrder, (order) => order.results, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lab_test_order_id' })
  labTestOrder: LabTestOrder;

  @Column({ name: 'lab_test_order_id' })
  labTestOrderId: string;

  @ManyToOne(() => MedicalRecord, (record) => record.labTestResults, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medical_record_id' })
  medicalRecord: MedicalRecord;

  @Column({ name: 'medical_record_id' })
  medicalRecordId: string;

  @Column({ nullable: true }) resultFile?: string;
  @Column({ type: 'text', nullable: true }) summary?: string;

  @Column({
    type: 'enum',
    enum: LabResultStatus,
    default: LabResultStatus.NORMAL,
  })
  status: LabResultStatus;

  @Column({ nullable: true }) enteredBy?: string;
  @Column({ type: 'datetime', nullable: true }) enteredAt?: Date;

  // --- Các chỉ số xét nghiệm máu ---
  @Column('float', { nullable: true }) bloodSugar?: number;
  @Column('float', { nullable: true }) cholesterolTotal?: number;
  @Column('float', { nullable: true }) hdl?: number;
  @Column('float', { nullable: true }) ldl?: number;
  @Column('float', { nullable: true }) triglycerides?: number;
  @Column('float', { nullable: true }) creatinine?: number;

  // --- Các chỉ số xét nghiệm nước tiểu ---
  @Column('float', { nullable: true }) urineProtein?: number;
  @Column('float', { nullable: true }) urinePH?: number;
  @Column('float', { nullable: true }) urineSugar?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
