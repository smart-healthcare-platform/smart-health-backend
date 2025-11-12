import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabTestOrder } from '../lab-test-order.entity';
import { CreateLabTestOrderDto } from '../dto/create-lab-test-order.dto';
import { LabTestOrderStatus } from '../enums/lab-test-order-status.enum';

@Injectable()
export class LabTestOrdersService {
    constructor(
        @InjectRepository(LabTestOrder)
        private readonly labTestOrderRepo: Repository<LabTestOrder>,
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

}
