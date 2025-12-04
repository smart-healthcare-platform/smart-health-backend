// src/modules/doctor/doctor.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { DoctorCertificate } from '../doctor-certificates/doctor-certificates.entity';
import { DoctorRating } from '../doctor-rating/doctor-rating.entity';
import { DoctorWeeklyAvailability } from '../doctor-schedule/entity/doctor-weekly-availability.entity';
import { DoctorSpecialAvailability } from '../doctor-schedule/entity/doctor-special-availability.entity';
import { AppointmentSlot } from '../appointment-slot/appointment-slot.entity';
import { Gender } from './enums/doctor-gender.enum';
import { DoctorBlockTime } from '../doctor-schedule/entity/doctor-block-time.entity';

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

  @Column({ length: 20, nullable: true })
  phone: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  /* ===========================
        RELATIONSHIPS
     =========================== */

  @OneToMany(() => DoctorCertificate, cert => cert.doctor)
  certificates: DoctorCertificate[];

  @OneToMany(() => DoctorRating, rating => rating.doctor)
  ratings: DoctorRating[];

  @OneToMany(() => DoctorWeeklyAvailability, w => w.doctor)
  weeklyAvailabilities: DoctorWeeklyAvailability[];

  @OneToMany(() => DoctorSpecialAvailability, s => s.doctor)
  specialAvailabilities: DoctorSpecialAvailability[];

  @OneToMany(() => DoctorBlockTime, block => block.doctor)
  blockTimes: DoctorBlockTime[];

  @OneToMany(() => AppointmentSlot, slot => slot.doctor)
  slots: AppointmentSlot[];
}
