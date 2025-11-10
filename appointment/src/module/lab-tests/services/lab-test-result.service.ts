import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabTestResult } from '../lab-test-results.entity';
import { CreateLabTestResultDto } from '../dto/create-lab-test-result.dto';
import { LabResultStatus } from '../enums/lab-test-result-status.enum';
import { LabTestOrder } from '../lab-test-order.entity';

@Injectable()
export class LabTestResultsService {
    constructor(
        @InjectRepository(LabTestResult)
        private readonly labTestResultRepo: Repository<LabTestResult>,
        @InjectRepository(LabTestOrder)
        private readonly labTestOrderRepo: Repository<LabTestOrder>
    ) { }

    async addLabTestResult(orderId: string, resultData: Partial<LabTestResult>): Promise<LabTestOrder> {
        const order = await this.labTestOrderRepo.findOne({
            where: { id: orderId },
            relations: ['result'],
        });

        if (!order) throw new NotFoundException('LabTestOrder not found');

        // Tạo Result mới
        const result = this.labTestResultRepo.create({
            ...resultData,
        });

        // Gán cho order
        order.result = result;

        // Save sẽ lưu cả order và result nhờ cascade
        return this.labTestOrderRepo.save(order);
    }


    async findAll(): Promise<LabTestResult[]> {
        return this.labTestResultRepo.find({
            relations: ['labTestOrder', 'medicalRecord'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<LabTestResult> {
        const result = await this.labTestResultRepo.findOne({
            where: { id },
            relations: ['labTestOrder', 'medicalRecord'],
        });

        if (!result) {
            throw new NotFoundException(`Lab test result with ID ${id} not found.`);
        }
        return result;
    }


    async updateSummary(
        id: string,
        summary: string,
    ): Promise<LabTestResult> {
        const result = await this.findOne(id);
        result.summary = summary;
        return this.labTestResultRepo.save(result);
    }

    async remove(id: string): Promise<void> {
        const deleteResult = await this.labTestResultRepo.delete(id);
        if (deleteResult.affected === 0) {
            throw new NotFoundException(`Lab test result with ID ${id} not found.`);
        }
    }

    // async findAllByOrder(orderId: string): Promise<LabTestResult[]> {
    //     return this.labTestResultRepo.find({
    //         where: { labTestOrderId: orderId },
    //         relations: ['labTestOrder', 'medicalRecord'],
    //         order: { createdAt: 'DESC' },
    //     });
    // }
}
