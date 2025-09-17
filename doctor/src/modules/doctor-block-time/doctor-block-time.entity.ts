import {
  Entity, Column, PrimaryGeneratedColumn,
  ManyToOne, JoinColumn, CreateDateColumn
} from 'typeorm';
import { Doctor } from '../doctor/doctor.entity';

@Entity('doctor_block_times')
export class DoctorBlockTime {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Doctor, doctor => doctor.blocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ type: 'char', length: 36 })
  doctor_id: string;

  @Column({ type: 'timestamp' })
  start_time: Date;

  @Column({ type: 'timestamp' })
  end_time: Date;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @CreateDateColumn()
  created_at: Date;
}
