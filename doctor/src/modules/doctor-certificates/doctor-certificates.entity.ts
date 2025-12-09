import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Doctor } from '../doctor/doctor.entity';
import { CertificateType } from './enums/certificate-type.enum';
import { AcademicDegree } from './enums/academic_degree.enum';

@Entity('doctor_certificates')
export class DoctorCertificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Doctor, doctor => doctor.certificates, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({
    type: 'enum',
    enum: CertificateType,
  })
  type: CertificateType;

  // DEGREE
  @Column({
    type: 'enum',
    enum: AcademicDegree,
    nullable: true
  })
  academic_degree: AcademicDegree;

  @Column({ length: 150, nullable: true })
  field: string;

  @Column({ type: 'year', nullable: true })
  graduation_year: number;

  // LICENSE
  @Column({ length: 100, nullable: true })
  license_number: string;

  @Column({ type: 'date', nullable: true })
  issued_date: Date;

  @Column({ type: 'date', nullable: true })
  expiry_date: Date;

  @Column({ length: 150, nullable: true })
  issued_by: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 255, nullable: true })
  certificate_file: string;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
  })
  status: 'PENDING' | 'APPROVED' | 'REJECTED';

  @Column({ default: false })
  is_verified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verified_at: Date;

  @Column({ length: 100, nullable: true })
  verified_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

