import {
  Entity, Column, PrimaryGeneratedColumn,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { Doctor } from '../doctor/doctor.entity';

@Entity('appointment_slots')
export class AppointmentSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Doctor, doctor => doctor.slots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ type: 'char', length: 36 })
  doctor_id: string;

  @Column({ type: 'datetime' })
  start_time: Date;

  @Column({ type: 'datetime' })
  end_time: Date;


  @Column({ type: 'enum', enum: ['available', 'booked', 'cancelled'], default: 'available' })
  status: 'available' | 'booked' | 'cancelled';

  @Column({ length: 36, nullable: true })
  patient_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
