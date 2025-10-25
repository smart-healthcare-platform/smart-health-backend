import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,
  ) {}

  async create(dto: CreatePatientDto): Promise<Patient> {
    const patient = this.patientRepo.create(dto);
    return this.patientRepo.save(patient);
  }

  async createFromUser(userData: any): Promise<Patient> {
    const existing = await this.patientRepo.findOne({
      where: { user_id: userData.id },
    });
    if (existing) return existing;

    const patient = this.patientRepo.create({
      user_id: userData.id,
      full_name: userData.fullName,
      date_of_birth: new Date(userData.dateOfBirth),
      gender: userData.gender,
      address: userData.address,
    });
    return this.patientRepo.save(patient);
  }

  async findAll(): Promise<Patient[]> {
    return this.patientRepo.find();
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
      relations: ['medical_records'],
    });
    if (!patient) {
      throw new NotFoundException(`Patient with id=${id} not found`);
    }
    return patient;
  }

  async update(id: string, dto: UpdatePatientDto): Promise<Patient> {
    await this.findOne(id); // check tồn tại
    await this.patientRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); 
    await this.patientRepo.delete(id);
  }
}
