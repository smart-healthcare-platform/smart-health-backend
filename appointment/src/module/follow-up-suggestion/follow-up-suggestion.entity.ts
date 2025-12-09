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
import { MedicalRecord } from '../medical-records/medical-records.entity';
import { FollowUpSuggestionStatus } from './enums/follow-up-suggestion-status.enum';
import { Appointment } from '../appointment/appointment.entity';

@Entity('follow-up-suggestions')
export class FollowUpSuggestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'medical_record_id' })
  medicalRecordId: string;

  @ManyToOne(() => MedicalRecord, (record) => record.followUpSuggestions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'medical_record_id' })
  medicalRecord: MedicalRecord;

  @Column()
  doctorId: string;

  @Column()
  patientId: string;

  @Column({ type: 'date', nullable: true })
  suggestedDate?: Date;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({
    type: 'enum',
    enum: FollowUpSuggestionStatus,
    default: FollowUpSuggestionStatus.PENDING,
  })
  status: FollowUpSuggestionStatus;

  @OneToOne(() => Appointment, (appt) => appt.followUpSuggestion, {
    nullable: true,
  })
  newAppointment?: Appointment;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
