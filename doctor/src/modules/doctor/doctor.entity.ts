import {
  Entity, Column, PrimaryGeneratedColumn,
  CreateDateColumn, UpdateDateColumn, OneToMany
} from 'typeorm';
import { DoctorCertificate } from '../doctor-certificates/doctor-certificates.entity';
import { DoctorRating } from '../doctor-rating/doctor-rating.entity';
import { DoctorAvailability } from '../doctor-availability/doctor-availability.entity';
import { DoctorBlockTime } from '../doctor-block-time/doctor-block-time.entity';
import { AppointmentSlot } from '../appointment-slot/appointment-slot.entity';
import { Gender } from './enums/doctor-gender.enum';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  full_name: string;

  @Column({ length: 36, nullable: true })
  user_id: string;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
    name: 'gender',
  })
  gender: Gender;

  @Column({ type: 'date', nullable: true })
  date_of_birth: Date;

  @Column({ length: 255, nullable: true })
  avatar: string;


  @Column({ type: 'int', default: 0 })
  experience_years: number;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ default: true })
  active: boolean;

  @Column({ length: 20, nullable: true })
  phone: string;

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
