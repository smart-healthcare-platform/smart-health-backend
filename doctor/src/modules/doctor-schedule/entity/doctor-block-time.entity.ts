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
  
  @Entity('doctor_block_times')
  export class DoctorBlockTime {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @ManyToOne(() => Doctor, doctor => doctor.blockTimes, {
      onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'doctor_id' })
    doctor: Doctor;
  
    @Column({ type: 'datetime' })
    start_block: Date;
  
    @Column({ type: 'datetime' })
    end_block: Date;
  
    @Column({ length: 255, nullable: true })
    reason: string;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  }
  