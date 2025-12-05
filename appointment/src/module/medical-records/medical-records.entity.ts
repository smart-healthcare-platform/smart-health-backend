import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Appointment } from '../appointment/appointment.entity';
import { VitalSign } from '../vital-signs/vital-signs.entity';
import { FollowUpSuggestion } from '../follow-up-suggestion/follow-up-suggestion.entity';
import { LabTestResult } from '../lab-tests/lab-test-results.entity';

@Entity('medical-records')
export class MedicalRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  symptoms?: string;

  @Column({ type: 'text' })
  diagnosis: string;

  @Column({ type: 'text', nullable: true })
  doctorNotes?: string;

  @Column({ type: 'text', nullable: true })
  prescription?: string;

  @Column({ type: 'uuid', nullable: true })
  prescriptionId?: string;

  @OneToOne(() => Appointment, (appointment) => appointment.medicalRecord, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  /** VitalSign: chỉ số tổng hợp */
  @OneToOne(() => VitalSign, (vitalSign) => vitalSign.medicalRecord, {
    cascade: true,
  })
  vitalSigns: VitalSign;

  /** Danh sách đề xuất tái khám */
  @OneToMany(() => FollowUpSuggestion, (follow) => follow.medicalRecord)
  followUpSuggestions: FollowUpSuggestion[];


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
