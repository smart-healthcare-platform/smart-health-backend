import {
    Entity, Column, PrimaryGeneratedColumn,
    ManyToOne, OneToMany, JoinColumn,
    CreateDateColumn, UpdateDateColumn
  } from 'typeorm';
import { Prescription } from '../prescriptions/prescription.entity';
@Entity('prescription_items')
export class PrescriptionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Prescription, pres => pres.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prescription_id' })
  prescription: Prescription;

  @Column({ type: 'char', length: 36 })
  prescription_id: string;

  @Column({ length: 255 })
  medicine_name: string;

  @Column({ length: 100 })
  dosage: string; // liều lượng

  @Column({ length: 100 })
  frequency: string; // tần suất

  @Column({ length: 100 })
  duration: string; // thời gian

  @Column({ type: 'text', nullable: true })
  instructions: string; // lưu ý thêm

  @CreateDateColumn()
  created_at: Date;
}
