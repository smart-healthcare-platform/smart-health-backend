import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Doctor } from '../doctor/doctor.entity';

@Entity('doctor_ratings')
export class DoctorRating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Doctor, doctor => doctor.ratings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ type: 'char', length: 36 })
  doctor_id: string;

  @Column({ type: 'int', default: 0 })
  rating: number; // 1-5

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ length: 36, nullable: true })
  patient_id: string; // nếu muốn lưu người đánh giá

  @CreateDateColumn()
  created_at: Date;
}
    