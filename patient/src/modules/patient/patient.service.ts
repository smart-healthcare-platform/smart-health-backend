import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Like, Repository } from 'typeorm';
import { Patient } from './patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,
  ) { }

  async create(dto: CreatePatientDto): Promise<Patient> {
    const existing = await this.patientRepo.findOne({
      where: { user_id: dto.user_id },
    });
    if (existing) return existing;
    const patient = this.patientRepo.create(dto);
    return this.patientRepo.save(patient);
  }

  async findAll(
    page = 1,
    limit = 5,
    search?: string,
  ): Promise<{ data: Patient[]; total: number; page: number; limit: number }> {
    const where = search
      ? [
        { full_name: Like(`%${search}%`) },
        { phone: Like(`%${search}%`) },
      ]
      : undefined;

    const [data, total] = await this.patientRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { full_name: 'ASC' },
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }


  async findByUserId(userId: string): Promise<Patient> {
    const patient = await this.patientRepo.findOne({
      where: { user_id: userId },
    });
    if (!patient) {
      throw new NotFoundException(`Patient with user_id=${userId} not found`);
    }
    return patient;
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientRepo.findOne({
      where: { id },
    });
    if (!patient) {
      throw new NotFoundException(`Patient with id=${id} not found`);
    }
    return patient;
  }

  async update(id: string, dto: UpdatePatientDto): Promise<Patient> {
    await this.findOne(id);
    await this.patientRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.patientRepo.delete(id);
  }

  async getPatientStats() {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const totalPatientsCurrent = await this.patientRepo.count();
    const totalPatientsLast = await this.patientRepo.count({
      where: { created_at: Between(startOfLastMonth, endOfLastMonth) },
    });

    const newThisMonth = await this.patientRepo.count({
      where: { created_at: Between(startOfCurrentMonth, endOfCurrentMonth) },
    });
    const newLastMonth = await this.patientRepo.count({
      where: { created_at: Between(startOfLastMonth, endOfLastMonth) },
    });

    // Lấy tất cả bệnh nhân để tính tuổi trung bình
    const patients = await this.patientRepo.find({ select: ['date_of_birth', 'created_at'] });

    const agesCurrent = patients
      .filter(p => p.date_of_birth)
      .map(p => {
        const dob = new Date(p.date_of_birth);
        const diff = now.getTime() - dob.getTime();
        return diff / 1000 / 60 / 60 / 24 / 365.25;
      });

    const averageAge = agesCurrent.length ? agesCurrent.reduce((a, b) => a + b, 0) / agesCurrent.length : 0;

    // Tính tuổi trung bình của bệnh nhân được tạo tháng trước
    const patientsLastMonth = patients.filter(p => p.date_of_birth && p.created_at >= startOfLastMonth && p.created_at <= endOfLastMonth);
    const agesLastMonth = patientsLastMonth.map(p => {
      const dob = new Date(p.date_of_birth);
      const diff = now.getTime() - dob.getTime();
      return diff / 1000 / 60 / 60 / 24 / 365.25;
    });
    const averageAgeLastMonth = agesLastMonth.length ? agesLastMonth.reduce((a, b) => a + b, 0) / agesLastMonth.length : 0;

    const calcChange = (current: number, previous: number) =>
      previous === 0 ? 0 : ((current - previous) / previous) * 100;

    return {
      totalPatients: { value: totalPatientsCurrent, change: calcChange(totalPatientsCurrent, totalPatientsLast) },
      newThisMonth: { value: newThisMonth, change: calcChange(newThisMonth, newLastMonth) },
      averageAge: { value: averageAge, change: calcChange(averageAge, averageAgeLastMonth) },
    };
  }


}
