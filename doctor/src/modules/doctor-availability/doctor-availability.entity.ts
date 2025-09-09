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

  @Column({ type: 'enum', enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] })
  day_of_week: string;

  @Column({ type: 'time' })
  start_time: string; // ví dụ 09:00

  @Column({ type: 'time' })
  end_time: string; // ví dụ 17:00

  @CreateDateColumn()
  created_at: Date;
}
