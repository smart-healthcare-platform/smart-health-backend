import {
  Entity, Column, PrimaryGeneratedColumn,
  ManyToOne, JoinColumn, CreateDateColumn
} from 'typeorm';
import { Doctor } from '../doctor/doctor.entity';

@Entity('doctor_certificates')
export class DoctorCertificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Doctor, doctor => doctor.certificates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ type: 'char', length: 36 })
  doctor_id: string;

  @Column({ type: 'enum', enum: ['degree', 'license'] })
  type: 'degree' | 'license';

  @Column({ length: 150 })
  title: string;

  @Column({ length: 150, nullable: true })
  field: string; // chuyên ngành (degree mới cần)

  @Column({ type: 'date', nullable: true })
  graduation_year: Date; // degree

  @Column({ type: 'date', nullable: true })
  issued_date: Date; // license

  @Column({ type: 'date', nullable: true })
  expiry_date: Date; // license

  @Column({ length: 255, nullable: true })
  certificate_file: string;

  @CreateDateColumn()
  created_at: Date;
}
