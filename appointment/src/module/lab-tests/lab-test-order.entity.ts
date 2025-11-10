import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Appointment } from '../appointment/appointment.entity';
import { LabTestType } from './enums/lab-test-type.enum';
import { LabTestOrderStatus } from './enums/lab-test-order-status.enum';
import { LabTestResult } from './lab-test-results.entity';
import { VitalSign } from '../vital-signs/vital-signs.entity';

@Entity('lab_test_orders')
export class LabTestOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Appointment, (appointment) => appointment.labTestOrders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column({ name: 'appointment_id' })
  appointmentId: string;

  @Column({ type: 'enum', enum: LabTestType })
  type: LabTestType;

  @Column({ type: 'enum', enum: LabTestOrderStatus, default: LabTestOrderStatus.ORDERED })
  status: LabTestOrderStatus;

  @Column({ nullable: true })
  orderedBy?: string;

  @OneToOne(() => LabTestResult, { cascade: true })
  @JoinColumn({ name: 'result_id' })
  result: LabTestResult;

  @OneToMany(() => VitalSign, (vitalSign) => vitalSign.labTestOrder)
  vitalSigns: VitalSign[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


