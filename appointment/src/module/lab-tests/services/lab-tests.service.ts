import {
    Injectable,
    NotFoundException,
    ConflictException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { LabTest } from '../lab-test.entity';
  import { CreateLabTestDto } from '../dto/create-lab-test.dto';
  import { UpdateLabTestDto } from '../dto/update-lab-test.dto';
  
  @Injectable()
  export class LabTestsService {
    constructor(
      @InjectRepository(LabTest)
      private readonly labTestRepo: Repository<LabTest>,
    ) {}
  
    /**
     * Tạo loại xét nghiệm mới
     */
    async create(dto: CreateLabTestDto): Promise<LabTest> {
      const existing = await this.labTestRepo.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException(`Lab test with name "${dto.name}" already exists.`);
      }
  
      const labTest = this.labTestRepo.create(dto);
      return this.labTestRepo.save(labTest);
    }
  
    /**
     * Lấy danh sách tất cả xét nghiệm
     */
    async findAll(): Promise<LabTest[]> {
      return this.labTestRepo.find({ order: { createdAt: 'DESC' } });
    }
  
    /**
     * Tìm xét nghiệm theo ID
     */
    async findOne(id: string): Promise<LabTest> {
      const test = await this.labTestRepo.findOne({ where: { id } });
      if (!test) {
        throw new NotFoundException(`Lab test with ID ${id} not found.`);
      }
      return test;
    }
  
    /**
     * Cập nhật thông tin xét nghiệm
     */
    async update(id: string, dto: UpdateLabTestDto): Promise<LabTest> {
      const existing = await this.labTestRepo.preload({
        id,
        ...dto,
      });
      if (!existing) {
        throw new NotFoundException(`Lab test with ID ${id} not found.`);
      }
      return this.labTestRepo.save(existing);
    }
  
    /**
     * Xóa một xét nghiệm
     */
    async remove(id: string): Promise<void> {
      const result = await this.labTestRepo.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`Lab test with ID ${id} not found.`);
      }
    }
  }
  