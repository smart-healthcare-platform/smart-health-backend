import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { MedicalRecord } from '../medical-records/medical-records.entity';
import { FollowUpSuggestion } from '../follow-up-suggestion/follow-up-suggestion.entity';
import { PaymentStatus } from './enums/payment-status.enum';
import { AppointmentStatus } from './enums/appointment-status.enum';
import { AppointmentType } from './enums/appointment-type.enum';
import { AppointmentCategory } from './enums/appointment-category.enum';
import { LabTestOrder } from '../lab-tests/lab-test-order.entity';
import { Transform } from 'class-transformer';

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

  @Column({
    type: 'enum',
    enum: AppointmentType,
    default: AppointmentType.OFFLINE,
  })
  type: AppointmentType;

  @Column({
    type: 'enum',
    enum: AppointmentCategory,
    default: AppointmentCategory.NEW,
  })
  category: AppointmentCategory;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'datetime' })
  startAt: Date;

  @Column({ type: 'datetime', nullable: true })
  endAt: Date;



  // ============ PAYMENT ============

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID,
  })
  paymentStatus: PaymentStatus;

  @Column({ nullable: true })
  paymentId: string;

  @Column({ nullable: true })
  paymentUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  paidAmount: number;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkedInAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 200000 })
  consultationFee: number;

  /** Nếu cuộc hẹn này được tạo từ một đề xuất tái khám */
  @ManyToOne(() => FollowUpSuggestion, (f) => f.newAppointment, {
    nullable: true,
  })
  @JoinColumn({ name: 'follow_up_id' })
  followUpSuggestion?: FollowUpSuggestion;

  @Column({ name: 'follow_up_id', nullable: true })
  followUpId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => MedicalRecord, (medicalRecord) => medicalRecord.appointment)
  medicalRecord: MedicalRecord;

  @OneToMany(() => LabTestOrder, (labTest) => labTest.appointment)
  labTestOrders: LabTestOrder[];
}
