import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from '../appointment/appointment.entity';
import { LabTest } from './lab-tests.entity';
import { LabTestResult } from './lab_test_results.entity';
import { LabTestsController } from './lab-tests.controller';
import { LabTestsService } from './lab-tests.service';
import { LabTestSeed } from './labtest.seed';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            LabTest,
            LabTestResult,
            Appointment,
        ]),
    ],
    controllers: [LabTestsController],
    providers: [LabTestsService,LabTestSeed],
    exports: [LabTestsService],
})
export class LabTestsModule { }