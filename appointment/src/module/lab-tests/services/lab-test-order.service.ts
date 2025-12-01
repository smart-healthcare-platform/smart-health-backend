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
            `Creating lab test order with payment for appointment ${dto.appointmentId}`,
        );

        // 1. Create lab test order first
        const order = this.labTestOrderRepo.create({
            ...dto,
            status: dto.status ?? LabTestOrderStatus.ORDERED,
        });
        const savedOrder = await this.labTestOrderRepo.save(order);

        // 2. Lookup lab test info for price
        let labTest: LabTest | null = null;
        try {
            if (dto.labTestId) {
                // If labTestId provided in DTO, use it directly
                labTest = await this.labTestsService.findOne(dto.labTestId);
                savedOrder.labTestId = dto.labTestId;
            } else {
                // Fallback: Find by type
                labTest = await this.labTestsService.findByType(dto.type);
                if (labTest) {
                    savedOrder.labTestId = labTest.id;
                }
            }
        } catch (error) {
            this.logger.warn(
                `Could not find lab test info for order ${savedOrder.id}: ${error.message}`,
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
                    `Creating payment for lab test ${labTest.name}: ${labTest.price}đ`,
                );

                const payment = await this.billingClient.createPayment(
                    paymentRequest,
                );

                // 4. Save paymentId to lab test order
                savedOrder.paymentId = payment.paymentCode;
                await this.labTestOrderRepo.save(savedOrder);

                this.logger.log(
                    `✅ Payment ${payment.paymentCode} created for lab test order ${savedOrder.id}`,
                );
            } catch (error) {
                // Log error but DON'T throw - we don't want to block doctor workflow
                this.logger.error(
                    `❌ Failed to create payment for lab test order ${savedOrder.id}: ${error.message}`,
                    error.stack,
                );
                // Receptionist will need to create payment manually later
                this.logger.warn(
                    `⚠️  Lab test order ${savedOrder.id} created WITHOUT payment - manual payment creation required`,
                );
            }
        } else {
            this.logger.warn(
                `No price found for lab test type ${dto.type} - skipping payment creation`,
            );
        }

        return savedOrder;
    }

}
