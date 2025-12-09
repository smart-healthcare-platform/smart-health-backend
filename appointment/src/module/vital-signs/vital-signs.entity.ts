import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { MedicalRecord } from '../medical-records/medical-records.entity';
import { VitalSignStatus } from './enums/vital-sign-status.enum';
import { LabTestOrder } from '../lab-tests/lab-test-order.entity';

@Entity({ name: 'vital-signs' })
export class VitalSign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // === Quan hệ với hồ sơ bệnh án ===
  @OneToOne(() => MedicalRecord, (record) => record.vitalSigns, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'medical_record_id' })
  medicalRecord: MedicalRecord;

  @Column({ name: 'medical_record_id' })
  medicalRecordId: string;

  // === Nếu được cập nhật từ kết quả xét nghiệm ===
  @ManyToOne(() => LabTestOrder, (labTest) => labTest.vitalSigns, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'lab_test_order_id' })
  labTestOrder?: LabTestOrder;

  @Column({ name: 'lab_test_order_id', nullable: true })
  labTestOrderId?: string;

  // --- Chỉ số đo trực tiếp ---
  @Column('float', { nullable: true }) temperature?: number;
  @Column('float', { nullable: true }) heartRate?: number;
  @Column('float', { nullable: true }) systolicPressure?: number;
  @Column('float', { nullable: true }) diastolicPressure?: number;
  @Column('float', { nullable: true }) oxygenSaturation?: number;
  @Column('float', { nullable: true }) height?: number;
  @Column('float', { nullable: true }) weight?: number;
  @Column('float', { nullable: true }) bmi?: number;

  // --- Chỉ số xét nghiệm máu ---
  @Column('float', { nullable: true }) bloodSugar?: number;
  @Column('float', { nullable: true }) cholesterolTotal?: number;
  @Column('float', { nullable: true }) hdl?: number;
  @Column('float', { nullable: true }) ldl?: number;
  @Column('float', { nullable: true }) triglycerides?: number;
  @Column('float', { nullable: true }) creatinine?: number;

  // --- Chỉ số xét nghiệm nước tiểu ---
  @Column('float', { nullable: true }) urineProtein?: number;
  @Column('float', { nullable: true }) urinePH?: number;
  @Column('float', { nullable: true }) urineSugar?: number;

  // --- Trạng thái ---
  @Column({
    type: 'enum',
    enum: VitalSignStatus,
    default: VitalSignStatus.COMPLETED,
  })
  status: VitalSignStatus;

  // --- Metadata ---
  @Column({ type: 'text', nullable: true }) notes?: string;
  @Column({ nullable: true }) recordedBy?: string;
  @Column({ type: 'datetime', nullable: true }) recordedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
