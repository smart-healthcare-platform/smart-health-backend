import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorCertificate } from './doctor-certificates.entity';
import { CreateDoctorCertificateDto } from './dto/create-doctor-certificates.dto';
import { UpdateDoctorLicenseDto } from './dto/update-doctor-certificates.dto';
import { CertificateType } from './enums/certificate-type.enum';
import { Doctor } from '../doctor/doctor.entity';

@Injectable()
export class DoctorCertificateService {
  constructor(
    @InjectRepository(DoctorCertificate)
    private licenseRepo: Repository<DoctorCertificate>,

    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>, 
  ) { }

  async create(dto: CreateDoctorCertificateDto): Promise<DoctorCertificate> {
    const { doctor_id, ...rest } = dto;

    const doctor = await this.doctorRepo.findOne({
      where: { id: doctor_id },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with id ${doctor_id} not found`);
    }

    const certificate = this.licenseRepo.create({
      doctor,
      ...rest,
    });
    return await this.licenseRepo.save(certificate);
  }




  async findAll(): Promise<DoctorCertificate[]> {
    return this.licenseRepo.find({ relations: ['doctor'] });
  }


  async findOne(id: string): Promise<DoctorCertificate> {
    const license = await this.licenseRepo.findOne({ where: { id }, relations: ['doctor'] });
    if (!license) throw new NotFoundException(`DoctorLicense with id ${id} not found`);
    return license;
  }

  async update(id: string, dto: UpdateDoctorLicenseDto): Promise<DoctorCertificate> {
    await this.findOne(id);
    await this.licenseRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.licenseRepo.delete(id);
  }
}
