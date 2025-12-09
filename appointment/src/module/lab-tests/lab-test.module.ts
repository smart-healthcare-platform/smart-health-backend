import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { Appointment } from '../appointment/appointment.entity';
import { LabTest } from './lab-test.entity';
import { LabTestResult } from './lab-test-results.entity';
import { LabTestsController } from './controllers/lab-test.controller';
import { LabTestsService } from './services/lab-tests.service';
import { LabTestSeed } from './labtest.seed';
import { LabTestOrder } from './lab-test-order.entity';
import { LabTestOrdersController } from './controllers/lab-test-orders.controller';
import { LabTestOrdersService } from './services/lab-test-order.service';
import { LabTestResultsService } from './services/lab-test-result.service';
import { LabTestResultsController } from './controllers/lab-test-result.controller';
import { BillingClient } from '@/common/clients/billing.client';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            LabTest,
            LabTestResult,
            Appointment,
            LabTestOrder
        ]),
        HttpModule,
    ],
    controllers: [LabTestsController, LabTestOrdersController, LabTestResultsController],
    providers: [LabTestsService, LabTestSeed, LabTestOrdersService, LabTestResultsService, BillingClient],
    exports: [LabTestsService, LabTestOrdersService, LabTestResultsService],
})
export class LabTestsModule { }