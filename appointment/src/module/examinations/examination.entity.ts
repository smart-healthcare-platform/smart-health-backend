import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('examinations')
export class Examination {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    appointmentId: string;

    @Column({ type: 'json', nullable: true })
    vitals: {
        bloodPressureSystolic?: number;
        bloodPressureDiastolic?: number;
        heartRate?: number;
        oxygenSaturation?: number;
        respiratoryRate?: number;
        temperature?: number;
        weight?: number;
        height?: number;
        bmi?: number;
    };

    @Column({ type: 'json', nullable: true })
    cardiologyMetrics: {
        bloodSugar?: number;
        cholesterolTotal?: number;
        cholesterolHDL?: number;
        cholesterolLDL?: number;
        triglycerides?: number;
    };

    @Column({ type: 'json', nullable: true })
    tests: {
        electrocardiogram?: any;
        echocardiogram?: any;
        cardiacMarkers?: any;
        labTests?: any[];
        imagingRequests?: any[];
    };
    @Column({ type: 'text', nullable: true }) symptoms: string;
    @Column({ type: 'text', nullable: true }) diagnosis: string;
    @Column({ type: 'text', nullable: true }) treatmentPlan: string;
    @Column({ type: 'json', nullable: true }) prescriptions: any[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
