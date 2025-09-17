import {
  Entity, Column, PrimaryGeneratedColumn,
  CreateDateColumn, UpdateDateColumn, OneToMany
} from 'typeorm';
import { DoctorCertificate } from '../doctor-certificates/doctor-certificates.entity';
import { DoctorRating } from '../doctor-rating/doctor-rating.entity';
import { DoctorAvailability } from '../doctor-availability/doctor-availability.entity';
import { DoctorBlockTime } from '../doctor-block-time/doctor-block-time.entity';
import { AppointmentSlot } from '../appointment-slot/appointment-slot.entity';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  full_name: string;

  @Column({ length: 100, unique: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: ['male', 'female', 'other'], nullable: true })
  gender: string;

  @Column({ type: 'date', nullable: true })
  date_of_birth: Date;

  @Column({ length: 255, nullable: true })
  avatar: string;

  @Column({ length: 100 })
  specialty: string;

  @Column({ type: 'int', default: 0 })
  experience_years: number;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Quan hệ
  @OneToMany(() => DoctorCertificate, cert => cert.doctor)
  certificates: DoctorCertificate[];

  @OneToMany(() => DoctorRating, rating => rating.doctor)
  ratings: DoctorRating[];

  @OneToMany(() => DoctorAvailability, avail => avail.doctor)
  availabilities: DoctorAvailability[];

  @OneToMany(() => DoctorBlockTime, block => block.doctor)
  blocks: DoctorBlockTime[];

  @OneToMany(() => AppointmentSlot, slot => slot.doctor)
  slots: AppointmentSlot[];
}
