import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('appointments')
export class Appointment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    doctorId: string; // tham chiếu doctor-service

    @Column()
    patientId: string; // tham chiếu patient-service

    @Column()
    slotId: string; // tham chiếu doctor-service.appointment_slots

    @Column({ default: 'pending' })
    status: string; // pending, confirmed, cancelled, completed

    @Column({ nullable: true })
    reason: string;

    @Column({ nullable: true })
    notes: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
