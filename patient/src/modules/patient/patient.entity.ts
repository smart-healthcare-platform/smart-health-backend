import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { MedicalRecord } from '../medical-records/medical-records.entity';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Mapping sang User Service (Spring Boot)
  @Column({ type: 'char', length: 36, unique: true })
  user_id: string;

  @Column({ length: 100 })
  full_name: string;

  @Column({ type: 'date', nullable: true })
  date_of_birth: Date;

  @Column({ length: 10, nullable: true })
  gender: string;

  @Column({ length: 255, nullable: true })
  address: string;

  // Quan hệ 1-nhiều: một bệnh nhân có nhiều hồ sơ bệnh án
  @OneToMany(() => MedicalRecord, (record) => record.patient)
  medical_records: MedicalRecord[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
