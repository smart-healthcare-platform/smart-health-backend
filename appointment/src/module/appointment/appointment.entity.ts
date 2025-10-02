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
    doctorId: string;
    @Column()
    doctorName: string;

    @Column({ nullable: true })
    patientId: string;
    @Column({ nullable: true })
    patientName: string;
    @Column()
    slotId: string;

    @Column({ default: 'pending' })
    status: string;

    @Column({ nullable: true })
    type: string;

    @Column({ nullable: true })
    notes: string;
    @Column()
    startAt: Date;
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
