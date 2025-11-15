import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../doctor/doctor.entity';
import { DoctorRating } from '../doctor-rating/doctor-rating.entity';
import { AppointmentSlot } from '../appointment-slot/appointment-slot.entity';
import { DoctorCertificate } from '../doctor-certificates/doctor-certificates.entity';
import { DoctorStatsDto } from './dto/doctor-stats.dto';
import {
  TopDoctorsResponseDto,
  TopDoctorDto,
  DepartmentPerformanceResponseDto,
  SpecialtyPerformanceDto,
} from './dto/top-doctors.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(DoctorRating)
    private readonly ratingRepository: Repository<DoctorRating>,
    @InjectRepository(AppointmentSlot)
    private readonly slotRepository: Repository<AppointmentSlot>,
    @InjectRepository(DoctorCertificate)
    private readonly certificateRepository: Repository<DoctorCertificate>,
  ) {}

  /**
   * Get overall doctor statistics
   */
  async getDoctorStats(): Promise<DoctorStatsDto> {
    try {
      this.logger.log('Fetching doctor statistics');

      // Total doctors
      const totalDoctors = await this.doctorRepository.count();

      // Active/Inactive doctors
      const activeDoctors = await this.doctorRepository.count({
        where: { active: true },
      });
      const inactiveDoctors = totalDoctors - activeDoctors;

      // New doctors this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const newDoctorsThisMonth = await this.doctorRepository
        .createQueryBuilder('doctor')
        .where('doctor.created_at >= :date', { date: startOfMonth })
        .getCount();

      // New doctors this week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const newDoctorsThisWeek = await this.doctorRepository
        .createQueryBuilder('doctor')
        .where('doctor.created_at >= :date', { date: startOfWeek })
        .getCount();

      // Doctors working today (have slots today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const doctorsWorkingTodayResult = await this.doctorRepository
        .createQueryBuilder('doctor')
        .innerJoin('doctor.slots', 'slot')
        .where('slot.start_time >= :today', { today })
        .andWhere('slot.start_time < :tomorrow', { tomorrow })
        .andWhere('doctor.active = :active', { active: true })
        .select('COUNT(DISTINCT doctor.id)', 'count')
        .getRawOne();

      const doctorsWorkingToday = parseInt(doctorsWorkingTodayResult?.count) || 0;

      // Rating statistics
      const ratingStats = await this.ratingRepository
        .createQueryBuilder('rating')
        .select('AVG(rating.rating)', 'averageRating')
        .addSelect('COUNT(rating.id)', 'totalRatings')
        .getRawOne();

      const averageRating = parseFloat(ratingStats?.averageRating) || 0;
      const totalRatings = parseInt(ratingStats?.totalRatings) || 0;

      // Appointment slot statistics
      const totalAppointmentSlots = await this.slotRepository.count();

      const bookedSlotsThisMonth = await this.slotRepository
        .createQueryBuilder('slot')
        .where('slot.start_time >= :date', { date: startOfMonth })
        .andWhere('slot.status = :status', { status: 'booked' })
        .getCount();

      // Most popular specialty
      const specialtyStats = await this.doctorRepository
        .createQueryBuilder('doctor')
        .select('doctor.specialty', 'specialty')
        .addSelect('COUNT(doctor.id)', 'count')
        .where('doctor.active = :active', { active: true })
        .groupBy('doctor.specialty')
        .orderBy('count', 'DESC')
        .limit(1)
        .getRawOne();

      const mostPopularSpecialty = specialtyStats?.specialty || null;
      const doctorsInMostPopularSpecialty = parseInt(specialtyStats?.count) || 0;

      // Average experience years
      const expStats = await this.doctorRepository
        .createQueryBuilder('doctor')
        .select('AVG(doctor.experience_years)', 'avgExp')
        .where('doctor.active = :active', { active: true })
        .getRawOne();

      const averageExperienceYears = parseFloat(expStats?.avgExp) || 0;

      // Doctors with certificates
      const doctorsWithCertificatesResult = await this.doctorRepository
        .createQueryBuilder('doctor')
        .innerJoin('doctor.certificates', 'cert')
        .select('COUNT(DISTINCT doctor.id)', 'count')
        .getRawOne();

      const doctorsWithCertificates = parseInt(doctorsWithCertificatesResult?.count) || 0;

      return {
        totalDoctors,
        activeDoctors,
        inactiveDoctors,
        newDoctorsThisMonth,
        newDoctorsThisWeek,
        doctorsWorkingToday,
        averageRating: Math.round(averageRating * 100) / 100,
        totalRatings,
        totalAppointmentSlots,
        bookedSlotsThisMonth,
        mostPopularSpecialty,
        doctorsInMostPopularSpecialty,
        averageExperienceYears: Math.round(averageExperienceYears * 10) / 10,
        doctorsWithCertificates,
      };
    } catch (error) {
      this.logger.error('Error fetching doctor stats', error.stack);
      throw error;
    }
  }

  /**
   * Get top doctors by various metrics
   */
  async getTopDoctors(limit: number = 10): Promise<TopDoctorsResponseDto> {
    try {
      this.logger.log(`Fetching top ${limit} doctors`);

      // Top by rating
      const topByRating = await this.doctorRepository
        .createQueryBuilder('doctor')
        .leftJoin('doctor.ratings', 'rating')
        .leftJoin('doctor.slots', 'slot')
        .select([
          'doctor.id as id',
          'doctor.full_name as fullName',
          'doctor.specialty as specialty',
          'doctor.experience_years as experienceYears',
          'doctor.avatar as avatar',
          'AVG(rating.rating) as averageRating',
          'COUNT(DISTINCT rating.id) as totalRatings',
          'COUNT(DISTINCT slot.id) as totalAppointments',
          'SUM(CASE WHEN slot.status = "booked" THEN 1 ELSE 0 END) as completedAppointments',
        ])
        .where('doctor.active = :active', { active: true })
        .groupBy('doctor.id')
        .having('COUNT(DISTINCT rating.id) >= 5') // At least 5 ratings
        .orderBy('averageRating', 'DESC')
        .addOrderBy('totalRatings', 'DESC')
        .limit(limit)
        .getRawMany();

      // Top by appointments
      const topByAppointments = await this.doctorRepository
        .createQueryBuilder('doctor')
        .leftJoin('doctor.ratings', 'rating')
        .leftJoin('doctor.slots', 'slot')
        .select([
          'doctor.id as id',
          'doctor.full_name as fullName',
          'doctor.specialty as specialty',
          'doctor.experience_years as experienceYears',
          'doctor.avatar as avatar',
          'AVG(rating.rating) as averageRating',
          'COUNT(DISTINCT rating.id) as totalRatings',
          'COUNT(DISTINCT slot.id) as totalAppointments',
          'SUM(CASE WHEN slot.status = "booked" THEN 1 ELSE 0 END) as completedAppointments',
        ])
        .where('doctor.active = :active', { active: true })
        .groupBy('doctor.id')
        .orderBy('totalAppointments', 'DESC')
        .addOrderBy('completedAppointments', 'DESC')
        .limit(limit)
        .getRawMany();

      // Top by revenue (using slot.price if available, otherwise estimate)
      const topByRevenue = await this.doctorRepository
        .createQueryBuilder('doctor')
        .leftJoin('doctor.ratings', 'rating')
        .leftJoin('doctor.slots', 'slot')
        .select([
          'doctor.id as id',
          'doctor.full_name as fullName',
          'doctor.specialty as specialty',
          'doctor.experience_years as experienceYears',
          'doctor.avatar as avatar',
          'AVG(rating.rating) as averageRating',
          'COUNT(DISTINCT rating.id) as totalRatings',
          'COUNT(DISTINCT slot.id) as totalAppointments',
          'SUM(CASE WHEN slot.status = "booked" THEN 1 ELSE 0 END) as completedAppointments',
          'SUM(CASE WHEN slot.status = "booked" THEN 500000 ELSE 0 END) as totalRevenue',
        ])
        .where('doctor.active = :active', { active: true })
        .groupBy('doctor.id')
        .orderBy('totalRevenue', 'DESC')
        .limit(limit)
        .getRawMany();

      const mapToDto = (raw: any): TopDoctorDto => ({
        id: raw.id,
        fullName: raw.fullName,
        specialty: raw.specialty,
        experienceYears: parseInt(raw.experienceYears) || 0,
        avatar: raw.avatar || null,
        averageRating: parseFloat(raw.averageRating) || 0,
        totalRatings: parseInt(raw.totalRatings) || 0,
        totalAppointments: parseInt(raw.totalAppointments) || 0,
        completedAppointments: parseInt(raw.completedAppointments) || 0,
        totalRevenue: parseFloat(raw.totalRevenue) || 0,
      });

      return {
        topByRating: topByRating.map(mapToDto),
        topByAppointments: topByAppointments.map(mapToDto),
        topByRevenue: topByRevenue.map(mapToDto),
      };
    } catch (error) {
      this.logger.error('Error fetching top doctors', error.stack);
      throw error;
    }
  }

  /**
   * Get performance metrics by specialty/department
   */
  async getDepartmentPerformance(): Promise<DepartmentPerformanceResponseDto> {
    try {
      this.logger.log('Fetching department performance metrics');

      const specialtyStats = await this.doctorRepository
        .createQueryBuilder('doctor')
        .leftJoin('doctor.ratings', 'rating')
        .leftJoin('doctor.slots', 'slot')
        .select([
          'doctor.specialty as specialty',
          'COUNT(DISTINCT doctor.id) as totalDoctors',
          'COUNT(DISTINCT CASE WHEN doctor.active = true THEN doctor.id END) as activeDoctors',
          'AVG(rating.rating) as averageRating',
          'COUNT(DISTINCT slot.id) as totalAppointments',
          'SUM(CASE WHEN slot.status = "booked" THEN 500000 ELSE 0 END) as totalRevenue',
          'AVG(doctor.experience_years) as averageExperienceYears',
        ])
        .groupBy('doctor.specialty')
        .orderBy('totalAppointments', 'DESC')
        .getRawMany();

      const specialties: SpecialtyPerformanceDto[] = specialtyStats.map((stat) => ({
        specialty: stat.specialty,
        totalDoctors: parseInt(stat.totalDoctors) || 0,
        activeDoctors: parseInt(stat.activeDoctors) || 0,
        averageRating: parseFloat(stat.averageRating) || 0,
        totalAppointments: parseInt(stat.totalAppointments) || 0,
        totalRevenue: parseFloat(stat.totalRevenue) || 0,
        averageExperienceYears: parseFloat(stat.averageExperienceYears) || 0,
      }));

      const topSpecialty = specialties.length > 0 ? specialties[0].specialty : 'N/A';
      const totalSpecialties = specialties.length;

      return {
        specialties,
        topSpecialty,
        totalSpecialties,
      };
    } catch (error) {
      this.logger.error('Error fetching department performance', error.stack);
      throw error;
    }
  }
}