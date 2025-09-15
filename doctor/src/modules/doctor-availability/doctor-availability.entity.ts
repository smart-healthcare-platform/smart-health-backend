import {
  Entity, Column, PrimaryGeneratedColumn,
  ManyToOne, JoinColumn, CreateDateColumn
} from 'typeorm';
import { Doctor } from '../doctor/doctor.entity';

@Entity('doctor_availabilities')
export class DoctorAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Doctor, doctor => doctor.availabilities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ type: 'char', length: 36 })
  doctor_id: string;

  // Ngày trong tuần
  @Column({ type: 'enum', enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] })
  day_of_week: string;

  // Ca làm việc
  @Column({ type: 'enum', enum: ['morning', 'afternoon', 'full'] })
  shift: 'morning' | 'afternoon' | 'full';

  @CreateDateColumn()
  created_at: Date;
}
