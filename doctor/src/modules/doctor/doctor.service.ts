import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DoctorListDto } from './dto/list-doctor.dto';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
  ) {}

  async create(dto: CreateDoctorDto): Promise<Doctor> {
    const doctor = this.doctorRepo.create(dto);
    return this.doctorRepo.save(doctor);
  }

  private buildDisplayDoctor(d: Doctor) {
    const mapDegreeToPrefix = (title: string): string => {
      if (!title) return '';
      if (title.includes('Giáo sư')) return 'GS.';
      if (title.includes('Phó giáo sư')) return 'PGS.';
      if (title.includes('Tiến sĩ')) return 'TS.';
      if (title.includes('Thạc sĩ')) return 'ThS.';
      if (title.includes('Cử nhân')) return 'CN.';
      if (title.includes('Bác sĩ chuyên khoa II')) return 'BSCKII';
      if (title.includes('Bác sĩ chuyên khoa I')) return 'BSCKI';
      return title;
    };

    const priority = ['Giáo sư', 'Phó giáo sư', 'Tiến sĩ', 'Thạc sĩ', 'Cử nhân'];

    const degrees = d.certificates?.filter(c => c.type === 'degree') || [];
    const sorted = degrees.sort((a, b) => priority.indexOf(a.title) - priority.indexOf(b.title));
    const mainDegree = sorted[0]?.title;

    const prefix = mainDegree ? mapDegreeToPrefix(mainDegree) : '';
    const display_name = prefix ? `${prefix} ${d.full_name}` : d.full_name;

    return {
      ...d,
      degree: mainDegree,
      display_name,
    };
  }

  async findAllBasic(): Promise<DoctorListDto[]> {
    const doctors = await this.doctorRepo.find({
      relations: ['certificates'],
      select: [
        'id',
        'full_name',
        'avatar',
        'specialty',
        'experience_years',
        'bio',
        'active',
      ],
    });

    return doctors.map(d => this.buildDisplayDoctor(d));
  }

  async findOne(id: string): Promise<any> {
    const doctor = await this.doctorRepo.findOne({
      where: { id },
      relations: ['certificates', 'ratings', 'availabilities', 'blocks', 'slots'],
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with id ${id} not found`);
    }

    return this.buildDisplayDoctor(doctor);
  }

  async update(id: string, dto: UpdateDoctorDto): Promise<any> {
    await this.findOne(id); // kiểm tra tồn tại
    await this.doctorRepo.update(id, dto);
    const updated = await this.findOne(id);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // kiểm tra tồn tại
    await this.doctorRepo.delete(id);
  }
}
