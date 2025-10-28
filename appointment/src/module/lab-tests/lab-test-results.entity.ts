import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
  } from 'typeorm';
  import { LabTest } from './lab-tests.entity';
  import { MedicalRecord } from '../medical-records/medical-records.entity';
  
  @Entity('lab-test-results')
  export class LabTestResult {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @ManyToOne(() => LabTest)
    @JoinColumn({ name: 'labTestId' })
    labTest: LabTest;
  
    @ManyToOne(() => MedicalRecord)
    @JoinColumn({ name: 'medicalRecordId' })
    medicalRecord: MedicalRecord;
  
    @Column({ nullable: true })
    resultFile?: string; // link file PDF upload
  
    @Column({ nullable: true })
    summary?: string; // tóm tắt ngắn (VD: “Cholesterol cao”, “Bình thường”)
  
    @Column({ default: 'waiting' })
    status: 'waiting' | 'completed' | 'cancelled';
  
    @CreateDateColumn()
    createdAt: Date;
  }
  