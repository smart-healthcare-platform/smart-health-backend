import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  
  @Entity('follow_up_suggestions')
  export class FollowUpSuggestion {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    originalAppointmentId: string;
  
    @Column()
    doctorId: string;
  
    @Column()
    patientId: string;
  
    @Column({ type: 'date', nullable: true })
    suggestedDate: Date;
  
    @Column({ type: 'text', nullable: true })
    reason: string;
  
    @Column({ default: 'PENDING' })
    status: string; // PENDING, ACCEPTED, REJECTED, DONE
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }
  