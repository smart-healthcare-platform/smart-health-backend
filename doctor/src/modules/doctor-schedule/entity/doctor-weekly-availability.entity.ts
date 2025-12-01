
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Doctor } from '../../doctor/doctor.entity';

import { DayOfWeek } from '../dto/create-doctor-weekly-availability.dto';

@Entity('doctor_weekly_availabilities')
export class DoctorWeeklyAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Doctor, doctor => doctor.weeklyAvailabilities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({
    type: 'enum',
    enum: DayOfWeek,
  })
  day_of_week: DayOfWeek;

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

