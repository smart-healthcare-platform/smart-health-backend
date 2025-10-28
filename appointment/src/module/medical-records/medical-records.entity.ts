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

@Entity('medical-records')
export class MedicalRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  symptoms: string;

  @Column({ type: 'text' })
  diagnosis: string;

  @Column({ type: 'text', nullable: true })
  doctorNotes: string;

  @Column({ type: 'text', nullable: true })
  prescription: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Appointment, (appointment) => appointment.medicalRecord)
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @OneToOne(() => VitalSign, (vitalSign) => vitalSign.medicalRecord, {
    cascade: true,
  })
  vitalSigns: VitalSign;

  @OneToMany(() => FollowUpSuggestion, (follow) => follow.medicalRecord)
  followUpSuggestions: FollowUpSuggestion[];
}

