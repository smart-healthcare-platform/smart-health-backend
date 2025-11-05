import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabTest } from './lab-tests.entity';
import { LabTestType } from './enums/lab-test-type.enum';

@Injectable()
export class LabTestSeed implements OnModuleInit {
  constructor(
    @InjectRepository(LabTest)
    private readonly labTestRepo: Repository<LabTest>,
  ) {}

  async onModuleInit() {
    const count = await this.labTestRepo.count();
    if (count > 0) {
      console.log('⚠️  Lab tests already exist, skipping seeding.');
      return;
    }

    const labTests = [
      {
        name: 'Xét nghiệm máu tổng quát',
        code: 'BLOOD_BASIC',
        description:
          'Đánh giá tổng thể sức khỏe qua các chỉ số như hồng cầu, bạch cầu, tiểu cầu, hemoglobin, glucose,...',
        price: 150000,
        isActive: true,
        type: LabTestType.BLOOD
      },
      {
        name: 'Xét nghiệm nước tiểu tổng quát',
        code: 'URINE_BASIC',
        description:
          'Kiểm tra chức năng thận, phát hiện nhiễm trùng đường tiểu, tiểu đường hoặc các bất thường khác.',
        price: 100000,
        isActive: true,
        type: LabTestType.URINE
      },
    ];

    await this.labTestRepo.save(labTests);
    console.log('✅ Đã khởi tạo 2 loại xét nghiệm cơ bản (máu & nước tiểu).');
  }
}
