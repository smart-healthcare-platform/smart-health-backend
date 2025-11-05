import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
  } from 'typeorm';
  import { Appointment } from '../appointment/appointment.entity';
  import { LabTestType } from './enums/lab-test-type.enum';
  import { LabTestStatus } from './enums/lab-test-status.enum';
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
  
    /** Loại xét nghiệm: máu, nước tiểu... */
    @Column({ type: 'enum', enum: LabTestType })
    type: LabTestType;
  
    @Column({ type: 'enum', enum: LabTestStatus, default: LabTestStatus.ORDERED })
    status: LabTestStatus;
  
    @Column({ nullable: true })
    orderedBy?: string; // id bác sĩ chỉ định
  
  
    @Column({ type: 'datetime', nullable: true })
    performedAt?: Date;
  
    /** Kết quả xét nghiệm */
    @OneToMany(() => LabTestResult, (result) => result.labTestOrder)
    results: LabTestResult[];
  
    /** VitalSigns được cập nhật từ kết quả của lệnh này */
    @OneToMany(() => VitalSign, (vitalSign) => vitalSign.labTestOrder)
    vitalSigns: VitalSign[];
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }
  