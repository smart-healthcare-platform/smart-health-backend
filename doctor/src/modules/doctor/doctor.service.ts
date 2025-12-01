import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Doctor } from './doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DoctorListDto } from './dto/list-doctor.dto';
import { DoctorProducerService } from 'src/kafka/doctor-producer.service';
import { randomUUID } from 'crypto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CertificateType } from '../doctor-certificates/enums/certificate-type.enum';
import { DoctorWeeklyAvailability } from '../doctor-schedule/entity/doctor-weekly-availability.entity';
import { UpsertDoctorWeeklyAvailabilityDto } from '../doctor-schedule/dto/create-doctor-weekly-availability.dto';
@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
    private readonly producer: DoctorProducerService,
    @InjectRepository(DoctorWeeklyAvailability)
    private weeklyRepo: Repository<DoctorWeeklyAvailability>,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) { }


  async saveCorrelation(doctorId: string, correlationId: string) {
    await this.cacheManager.set(
      `doctor:create:${correlationId}`,
      doctorId,
      300,
    );
  }

  async getDoctorIdFromCorrelation(correlationId: string): Promise<string | null> {
    const value = await this.cacheManager.get<string>(`doctor:create:${correlationId}`);
    return value ?? null;
  }

  async deleteCorrelation(correlationId: string) {
    await this.cacheManager.del(`doctor:create:${correlationId}`);
  }


  async updateDoctorUserId(doctorId: string, user_id: string) {
    await this.doctorRepo.update(doctorId, { user_id });
  }

  async create(dto: CreateDoctorDto): Promise<Doctor> {
    const doctor = this.doctorRepo.create(dto);
    const saved = await this.doctorRepo.save(doctor);

    const correlationId = randomUUID();

    await this.saveCorrelation(saved.id, correlationId);

    this.producer.createUserForDoctor({
      doctorId: saved.id,
      email: dto.email,
      fullName: dto.full_name,
      dob: dto.date_of_birth,
      correlationId,
    });

    return saved;
  }

  async findByIds(ids: string[]): Promise<Doctor[]> {
    return this.doctorRepo.find({ where: { id: In(ids) } });
  }
  private buildDisplayDoctor(d: Doctor) {
    const mapDegreeToPrefix = (title: string): string => {
      if (!title) return '';
      if (title.includes('Giáo sư')) return 'GS.';
      if (title.includes('Phó giáo sư')) return 'PGS.';
      if (title.includes('Tiến sĩ')) return 'TS.';
      if (title.includes('Thạc sĩ')) return 'ThS.';
      if (title.includes('Cử nhân')) return 'CN.';
      if (title.includes('Bác sĩ chuyên khoa II')) return 'BSCKII.';
      if (title.includes('Bác sĩ chuyên khoa I')) return 'BSCKI.';
      if (title.includes('Bác sĩ')) return 'BS.';
      return title;
    };

    const priority = [
      'Giáo sư',
      'Phó giáo sư',
      'Tiến sĩ',
      'Thạc sĩ',
      'Cử nhân',
    ];

    const degrees = d.certificates?.filter((c) => c.type === CertificateType.DEGREE) || [];
    const sorted = degrees.sort(
      (a, b) => priority.indexOf(a.title) - priority.indexOf(b.title),
    );
    const mainDegree = sorted[0]?.title;

    const prefix = mainDegree ? mapDegreeToPrefix(mainDegree) : '';
    const display_name = prefix ? `${prefix} ${d.full_name}` : d.full_name;

    return {
      ...d,
      degree: mainDegree,
      display_name,
    };
  }

  async findByUserId(userId: string): Promise<Doctor> {
    const doctor = await this.doctorRepo.findOne({
      where: { user_id: userId },
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor with user_id=${userId} not found`);
    }
    return doctor;
  }

  async findAllBasic(
    page = 1,
    limit = 6,
    search = '',
  ): Promise<{
    data: DoctorListDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const qb = this.doctorRepo
      .createQueryBuilder('doctor')
      .select([
        'doctor.id',
        'doctor.full_name',
        'doctor.avatar',
        'doctor.gender',
        'doctor.experience_years',
        'doctor.bio',
        'doctor.phone',
        'doctor.date_of_birth',
        'doctor.user_id'
      ])
      .orderBy('doctor.full_name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.where('doctor.full_name LIKE :search', { search: `%${search}%` });
    }

    const [doctors, total] = await qb.getManyAndCount();

    return {
      data: doctors.map((d) => this.buildDisplayDoctor(d)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<any> {
    const doctor = await this.doctorRepo.findOne({
      where: { id },
      relations: [
        'certificates',
        'ratings',
        'weeklyAvailabilities',
        'specialAvailabilities',
        'blockTimes',
        'slots',
      ],
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

  async upsertWeeklyAvailability(
    doctorId: string,
    dto: UpsertDoctorWeeklyAvailabilityDto,
  ) {
    const doctor = await this.doctorRepo.findOne({
      where: { id: doctorId },
    });

    if (!doctor) throw new NotFoundException(`Doctor ${doctorId} not found`);

    await this.weeklyRepo.delete({ doctor: { id: doctorId } });

    const newItems = dto.weekly.map(w =>
      this.weeklyRepo.create({
        doctor,
        day_of_week: w.day_of_week,
        start_time: w.start_time,
        end_time: w.end_time,
      }),
    );

    return this.weeklyRepo.save(newItems);
  }

  async getWeeklyAvailabilities(doctorId: string): Promise<DoctorWeeklyAvailability[]> {
    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });

    if (!doctor) {
      throw new NotFoundException(`Doctor ${doctorId} not found`);
    }

    return this.weeklyRepo.find({
      where: { doctor: { id: doctorId } },
    });
  }

  async getDoctorStats() {
    const now = new Date();

    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
    );

    // Tổng bác sĩ hiện tại
    const totalDoctorsCurrent = await this.doctorRepo.count();

    // Tổng bác sĩ tháng trước (tạo trong tháng trước)
    const totalDoctorsLast = await this.doctorRepo.count({
      where: { created_at: Between(startOfLastMonth, endOfLastMonth) },
    });

    // Bác sĩ mới tháng này
    const newThisMonth = await this.doctorRepo.count({
      where: { created_at: Between(startOfCurrentMonth, endOfCurrentMonth) },
    });

    // Bác sĩ mới tháng trước
    const newLastMonth = await this.doctorRepo.count({
      where: { created_at: Between(startOfLastMonth, endOfLastMonth) },
    });

    // Lấy toàn bộ doctor để tính tuổi trung bình
    const doctors = await this.doctorRepo.find({
      select: ['date_of_birth', 'created_at'],
    });

    // Tuổi trung bình tất cả bác sĩ
    const agesCurrent = doctors
      .filter((d) => d.date_of_birth)
      .map((d) => {
        const dob = new Date(d.date_of_birth);
        const diff = now.getTime() - dob.getTime();
        return diff / 1000 / 60 / 60 / 24 / 365.25;
      });

    const averageAge =
      agesCurrent.length > 0
        ? agesCurrent.reduce((a, b) => a + b, 0) / agesCurrent.length
        : 0;

    // Tuổi trung bình bác sĩ tạo trong tháng trước
    const doctorsLastMonth = doctors.filter(
      (d) =>
        d.date_of_birth &&
        d.created_at >= startOfLastMonth &&
        d.created_at <= endOfLastMonth,
    );

    const agesLastMonth = doctorsLastMonth.map((d) => {
      const dob = new Date(d.date_of_birth);
      const diff = now.getTime() - dob.getTime();
      return diff / 1000 / 60 / 60 / 24 / 365.25;
    });

    const averageAgeLastMonth =
      agesLastMonth.length > 0
        ? agesLastMonth.reduce((a, b) => a + b, 0) / agesLastMonth.length
        : 0;

    // Helper calc %
    const calcChange = (current: number, previous: number) =>
      previous === 0 ? 0 : ((current - previous) / previous) * 100;

    return {
      totalDoctors: {
        value: totalDoctorsCurrent,
        change: calcChange(totalDoctorsCurrent, totalDoctorsLast),
      },
      newThisMonth: {
        value: newThisMonth,
        change: calcChange(newThisMonth, newLastMonth),
      },
      averageAge: {
        value: averageAge,
        change: calcChange(averageAge, averageAgeLastMonth),
      },
    };
  }

}
