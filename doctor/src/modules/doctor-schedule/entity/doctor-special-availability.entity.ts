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
  
  @Entity('doctor_special_availabilities')
  export class DoctorSpecialAvailability {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @ManyToOne(() => Doctor, doctor => doctor.specialAvailabilities, {
      onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'doctor_id' })
    doctor: Doctor;
  
    @Column({ type: 'date' })
    date: string;
  
    @Column({ type: 'time' })
    start_time: string;
  
    @Column({ type: 'time' })
    end_time: string;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  }
  