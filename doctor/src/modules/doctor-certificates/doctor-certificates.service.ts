import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorCertificate } from './doctor-certificates.entity';
import { CreateDoctorCertificateDto } from './dto/create-doctor-certificates.dto';
import { UpdateDoctorLicenseDto } from './dto/update-doctor-certificates.dto';
import { CertificateType } from './enums/certificate-type.enum';
import { Doctor } from '../doctor/doctor.entity';
import { AcademicDegree } from './enums/academic_degree.enum';

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

    await this.licenseRepo.save(certificate);

    if (certificate.type === CertificateType.DEGREE) {
      await this.updateDoctorDisplayName(doctor_id);
    }

    return certificate;
  }

  public async updateDoctorDisplayName(doctor_id: string) {
    const doctor = await this.doctorRepo.findOne({
      where: { id: doctor_id },
      relations: ['certificates']
    });

    if (!doctor) return;

    const mapped = this.buildDisplayDoctor(doctor);

    await this.doctorRepo.update(doctor_id, {
      display_name: mapped.display_name
    });
  }

  private buildDisplayDoctor(doctor: Doctor): Doctor {
    const mapDegreeToPrefix = (deg?: AcademicDegree): string => {
      switch (deg) {
        case AcademicDegree.PROFESSOR:
          return 'GS.';
        case AcademicDegree.ASSOCIATE_PROFESSOR:
          return 'PGS.';
        case AcademicDegree.SPECIALIST_II:
          return 'BSCKII.';
        case AcademicDegree.SPECIALIST_I:
          return 'BSCKI.';
        case AcademicDegree.PHD:
          return 'TS.';
        case AcademicDegree.MASTER:
          return 'ThS.';
        case AcademicDegree.BACHELOR:
          return 'CN.';
        case AcademicDegree.MD:
          return 'BS.';
        default:
          return '';
      }
    };

    const priority: AcademicDegree[] = [
      AcademicDegree.PROFESSOR,
      AcademicDegree.ASSOCIATE_PROFESSOR,
      AcademicDegree.SPECIALIST_II,
      AcademicDegree.SPECIALIST_I,
      AcademicDegree.PHD,
      AcademicDegree.MASTER,
      AcademicDegree.BACHELOR,
      AcademicDegree.MD,
    ];

    const degrees = doctor.certificates?.filter(
      (c) => c.type === CertificateType.DEGREE
    ) || [];

    const sorted = degrees.sort(
      (a, b) => priority.indexOf(a.academic_degree) - priority.indexOf(b.academic_degree),
    );

    const mainDegree = sorted[0]?.academic_degree;

    const prefix = mapDegreeToPrefix(mainDegree);

    const display_name = prefix ? `${prefix} ${doctor.full_name}` : doctor.full_name;

    return {
      ...doctor,
      display_name,
    };
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
    const existing = await this.findOne(id);

    await this.licenseRepo.update(id, dto);

    const updated = await this.findOne(id);

    if (updated.type === CertificateType.DEGREE) {
      await this.updateDoctorDisplayName(updated.doctor.id);
    }

    return updated;
  }


  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.licenseRepo.delete(id);
  }
}
