import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabTestOrder } from '../lab-test-order.entity';
import { LabTest } from '../lab-test.entity';
import { CreateLabTestOrderDto } from '../dto/create-lab-test-order.dto';
import { LabTestOrderStatus } from '../enums/lab-test-order-status.enum';
import { BillingClient, CreatePaymentRequest } from '@/common/clients/billing.client';
import { LabTestsService } from './lab-tests.service';

@Injectable()
export class LabTestOrdersService {
    private readonly logger = new Logger(LabTestOrdersService.name);

    constructor(
        @InjectRepository(LabTestOrder)
        private readonly labTestOrderRepo: Repository<LabTestOrder>,
        private readonly billingClient: BillingClient,
        private readonly labTestsService: LabTestsService,
    ) { }

    async create(dto: CreateLabTestOrderDto): Promise<LabTestOrder> {
        const order = this.labTestOrderRepo.create({
            ...dto,
            status: dto.status ?? LabTestOrderStatus.ORDERED,
        });
        return this.labTestOrderRepo.save(order);
    }

    async findAll(): Promise<LabTestOrder[]> {
        return this.labTestOrderRepo.find({
            relations: ['appointment', 'result', 'vitalSigns'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<LabTestOrder> {
        const order = await this.labTestOrderRepo.findOne({
            where: { id },
            relations: ['appointment', 'results', 'vitalSigns'],
        });

        if (!order) {
            throw new NotFoundException(`Lab test order with ID ${id} not found.`);
        }
        return order;
    }


    async updateStatus(
        id: string,
        status: LabTestOrderStatus,
    ): Promise<LabTestOrder> {
        const order = await this.findOne(id);
        order.status = status;
        return this.labTestOrderRepo.save(order);
    }

    async remove(id: string): Promise<void> {
        const result = await this.labTestOrderRepo.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Lab test order with ID ${id} not found.`);
        }
    }

    async findAllByDoctor(doctorId: string): Promise<LabTestOrder[]> {
        return this.labTestOrderRepo
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.appointment', 'appointment')
            .leftJoinAndSelect('order.result', 'result')
            .leftJoinAndSelect('order.vitalSigns', 'vitalSigns')
            .where('appointment.doctorId = :doctorId', { doctorId })
            .orderBy('order.createdAt', 'DESC')
            .getMany();
    }

    /**
     * Create lab test order WITH automatic payment creation
     * This is the recommended method for creating lab test orders during examination
     * 
     * Flow:
     * 1. Create LabTestOrder
     * 2. Lookup LabTest master data for price
     * 3. Call Billing Service to create Payment
     * 4. Save paymentId back to LabTestOrder
     * 
     * @param dto Lab test order creation data
     * @returns Created lab test order with paymentId populated
     */
    async createWithPayment(dto: CreateLabTestOrderDto): Promise<LabTestOrder> {
        this.logger.log(
            `🔵 [START] Creating lab test order with payment for appointment ${dto.appointmentId}`,
        );
        this.logger.debug(`📝 DTO received:`, JSON.stringify(dto, null, 2));

        // 1. Create lab test order first
        const order = this.labTestOrderRepo.create({
            ...dto,
            status: dto.status ?? LabTestOrderStatus.ORDERED,
        });
        const savedOrder = await this.labTestOrderRepo.save(order);
        this.logger.log(`✅ Lab test order created with ID: ${savedOrder.id}`);

        // 2. Lookup lab test info for price
        let labTest: LabTest | null = null;
        try {
            this.logger.log(`🔍 Looking up lab test info...`);
            if (dto.labTestId) {
                this.logger.log(`   Using provided labTestId: ${dto.labTestId}`);
                labTest = await this.labTestsService.findOne(dto.labTestId);
                savedOrder.labTestId = dto.labTestId;
            } else {
                this.logger.log(`   No labTestId provided, searching by type: ${dto.type}`);
                labTest = await this.labTestsService.findByType(dto.type);
                if (labTest) {
                    savedOrder.labTestId = labTest.id;
                }
            }
            
            if (labTest) {
                this.logger.log(`✅ Found lab test: ${labTest.name} - Price: ${labTest.price}đ`);
            } else {
                this.logger.warn(`⚠️  No lab test found for type: ${dto.type}`);
            }
        } catch (error) {
            this.logger.error(
                `❌ Error finding lab test info for order ${savedOrder.id}: ${error.message}`,
                error.stack,
            );
        }

        // 3. Create payment if lab test has price
        if (labTest && labTest.price > 0) {
            try {
                const paymentRequest: CreatePaymentRequest = {
                    paymentType: 'LAB_TEST',
                    referenceId: savedOrder.id,
                    amount: labTest.price,
                    paymentMethod: 'CASH', // Default CASH - receptionist will collect
                };

                this.logger.log(
                    `💳 Creating payment for lab test "${labTest.name}": ${labTest.price}đ`,
                );
                this.logger.debug(`   Payment request:`, JSON.stringify(paymentRequest, null, 2));

                const payment = await this.billingClient.createPayment(
                    paymentRequest,
                );
                
                this.logger.log(`✅ Payment created successfully:`, JSON.stringify({
                    paymentCode: payment.paymentCode,
                    amount: payment.amount,
                    status: payment.status,
                }, null, 2));

                // 4. Save paymentId to lab test order
                savedOrder.paymentId = payment.paymentCode;
                await this.labTestOrderRepo.save(savedOrder);

                this.logger.log(
                    `✅ Payment ${payment.paymentCode} linked to lab test order ${savedOrder.id}`,
                );
                this.logger.log(`🔵 [END] Lab test order with payment completed successfully`);
            } catch (error) {
                // Log error but DON'T throw - we don't want to block doctor workflow
                this.logger.error(
                    `❌ Failed to create payment for lab test order ${savedOrder.id}`,
                );
                this.logger.error(`   Error message: ${error.message}`);
                this.logger.error(`   Error stack:`, error.stack);
                if (error.response) {
                    this.logger.error(`   Response status: ${error.response?.status}`);
                    this.logger.error(`   Response data:`, JSON.stringify(error.response?.data, null, 2));
                }
                // Receptionist will need to create payment manually later
                this.logger.warn(
                    `⚠️  Lab test order ${savedOrder.id} created WITHOUT payment - manual payment creation required`,
                );
            }
        } else {
            if (!labTest) {
                this.logger.warn(
                    `⚠️  No lab test found for type ${dto.type} - skipping payment creation`,
                );
            } else if (labTest.price <= 0) {
                this.logger.warn(
                    `⚠️  Lab test "${labTest.name}" has price ${labTest.price} - skipping payment creation`,
                );
            }
        }

        return savedOrder;
    }

}
