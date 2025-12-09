import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../patient/patient.entity';
import { PatientStatsDto } from './dto/patient-stats.dto';
import { PatientGrowthDto, GrowthDataPoint } from './dto/patient-growth.dto';
import {
  PatientDemographicsDto,
  AgeGroupDistribution,
  GenderDistribution,
} from './dto/patient-demographics.dto';
import {
  RecentPatientsDto,
  RecentPatientItem,
} from './dto/recent-patients.dto';

/**
 * Admin Service
 * Handles all admin-related operations for patient analytics and statistics
 */
@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
  ) {}

  /**
   * Get overall patient statistics
   * Returns key metrics for admin dashboard
   */
  async getPatientStats(): Promise<PatientStatsDto> {
    try {
      this.logger.log('Fetching patient statistics');

      // Get total patients
      const totalPatients = await this.patientRepository.count();

      // Get active patients (those updated in last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const activePatients = await this.patientRepository
        .createQueryBuilder('patient')
        .where('patient.updated_at >= :date', { date: ninetyDaysAgo })
        .getCount();

      // Get new patients this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const newThisMonth = await this.patientRepository
        .createQueryBuilder('patient')
        .where('patient.created_at >= :date', { date: startOfMonth })
        .getCount();

      // Get new patients this week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const newThisWeek = await this.patientRepository
        .createQueryBuilder('patient')
        .where('patient.created_at >= :date', { date: startOfWeek })
        .getCount();

      // Calculate growth rate (compare this month to last month)
      const startOfLastMonth = new Date();
      startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
      startOfLastMonth.setDate(1);
      startOfLastMonth.setHours(0, 0, 0, 0);

      const newLastMonth = await this.patientRepository
        .createQueryBuilder('patient')
        .where('patient.created_at >= :startDate', {
          startDate: startOfLastMonth,
        })
        .andWhere('patient.created_at < :endDate', { endDate: startOfMonth })
        .getCount();

      const growthRate =
        newLastMonth > 0
          ? ((newThisMonth - newLastMonth) / newLastMonth) * 100
          : newThisMonth > 0
            ? 100
            : 0;

      // Get average age
      const patientsWithDob = await this.patientRepository
        .createQueryBuilder('patient')
        .select('patient.date_of_birth')
        .where('patient.date_of_birth IS NOT NULL')
        .getRawMany();

      let averageAge = 0;
      if (patientsWithDob.length > 0) {
        const ages = patientsWithDob.map((p) => {
          const dob = new Date(p.patient_date_of_birth);
          const today = new Date();
          let age = today.getFullYear() - dob.getFullYear();
          const monthDiff = today.getMonth() - dob.getMonth();
          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < dob.getDate())
          ) {
            age--;
          }
          return age;
        });
        averageAge = Math.round(
          ages.reduce((sum, age) => sum + age, 0) / ages.length,
        );
      }

      // Get gender distribution
      const genderStats = await this.patientRepository
        .createQueryBuilder('patient')
        .select('patient.gender', 'gender')
        .addSelect('COUNT(*)', 'count')
        .where('patient.gender IS NOT NULL')
        .groupBy('patient.gender')
        .getRawMany();

      let maleCount = 0;
      let femaleCount = 0;
      let otherGenderCount = 0;
      let mostCommonGender = 'N/A';
      let maxCount = 0;

      genderStats.forEach((stat) => {
        const gender = stat.gender?.toLowerCase();
        const count = parseInt(stat.count, 10);

        if (gender === 'male' || gender === 'nam') {
          maleCount = count;
        } else if (gender === 'female' || gender === 'nữ' || gender === 'nu') {
          femaleCount = count;
        } else {
          otherGenderCount += count;
        }

        if (count > maxCount) {
          maxCount = count;
          mostCommonGender = stat.gender;
        }
      });

      return {
        totalPatients,
        activePatients,
        newThisMonth,
        newThisWeek,
        growthRate: Math.round(growthRate * 100) / 100, // Round to 2 decimals
        averageAge,
        mostCommonGender,
        maleCount,
        femaleCount,
        otherGenderCount,
      };
    } catch (error) {
      this.logger.error('Error fetching patient stats', error);
      throw error;
    }
  }

  /**
   * Get patient growth trends
   * @param period - 'daily', 'weekly', or 'monthly'
   * @param days - Number of days to look back (default: 30)
   */
  async getPatientGrowth(
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
    days: number = 30,
  ): Promise<PatientGrowthDto> {
    try {
      this.logger.log(`Fetching patient growth for period: ${period}`);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      // Get all patients created since startDate
      const patients = await this.patientRepository
        .createQueryBuilder('patient')
        .select('DATE(patient.created_at)', 'date')
        .addSelect('COUNT(*)', 'count')
        .where('patient.created_at >= :startDate', { startDate })
        .groupBy('DATE(patient.created_at)')
        .orderBy('DATE(patient.created_at)', 'ASC')
        .getRawMany();

      // Get total count before startDate for cumulative calculation
      const countBeforeStart = await this.patientRepository
        .createQueryBuilder('patient')
        .where('patient.created_at < :startDate', { startDate })
        .getCount();

      // Build data points
      const dataPoints: GrowthDataPoint[] = [];
      let cumulative = countBeforeStart;

      // Fill in missing dates with 0 counts
      const currentDate = new Date(startDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const patientMap = new Map(
        patients.map((p) => [p.date, parseInt(p.count, 10)]),
      );

      while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const count = patientMap.get(dateStr) || 0;
        cumulative += count;

        dataPoints.push({
          date: dateStr,
          count,
          cumulative,
        });

        // Increment date based on period
        if (period === 'daily') {
          currentDate.setDate(currentDate.getDate() + 1);
        } else if (period === 'weekly') {
          currentDate.setDate(currentDate.getDate() + 7);
        } else {
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }

      // Calculate total growth and percentage change
      const totalGrowth = cumulative - countBeforeStart;
      const percentageChange =
        countBeforeStart > 0
          ? (totalGrowth / countBeforeStart) * 100
          : totalGrowth > 0
            ? 100
            : 0;

      return {
        period,
        data: dataPoints,
        totalGrowth,
        percentageChange: Math.round(percentageChange * 100) / 100,
      };
    } catch (error) {
      this.logger.error('Error fetching patient growth', error);
      throw error;
    }
  }

  /**
   * Get patient demographics breakdown
   * Returns age groups and gender distribution
   */
  async getPatientDemographics(): Promise<PatientDemographicsDto> {
    try {
      this.logger.log('Fetching patient demographics');

      // Get all patients with date of birth
      const patientsWithDob = await this.patientRepository
        .createQueryBuilder('patient')
        .select(['patient.date_of_birth', 'patient.gender'])
        .where('patient.date_of_birth IS NOT NULL')
        .getRawMany();

      const totalPatients = await this.patientRepository.count();

      // Calculate ages and categorize
      const ageGroups = {
        '0-18': 0,
        '19-30': 0,
        '31-45': 0,
        '46-60': 0,
        '60+': 0,
      };

      const ages: number[] = [];

      patientsWithDob.forEach((p) => {
        const dob = new Date(p.patient_date_of_birth);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < dob.getDate())
        ) {
          age--;
        }

        ages.push(age);

        if (age <= 18) ageGroups['0-18']++;
        else if (age <= 30) ageGroups['19-30']++;
        else if (age <= 45) ageGroups['31-45']++;
        else if (age <= 60) ageGroups['46-60']++;
        else ageGroups['60+']++;
      });

      // Calculate average and median age
      const averageAge =
        ages.length > 0
          ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length)
          : 0;

      ages.sort((a, b) => a - b);
      const medianAge =
        ages.length > 0
          ? ages.length % 2 === 0
            ? Math.round((ages[ages.length / 2 - 1] + ages[ages.length / 2]) / 2)
            : ages[Math.floor(ages.length / 2)]
          : 0;

      // Build age group distribution
      const ageGroupDistribution: AgeGroupDistribution[] = Object.entries(
        ageGroups,
      ).map(([ageGroup, count]) => ({
        ageGroup,
        count,
        percentage:
          patientsWithDob.length > 0
            ? Math.round((count / patientsWithDob.length) * 10000) / 100
            : 0,
      }));

      // Get gender distribution
      const genderStats = await this.patientRepository
        .createQueryBuilder('patient')
        .select('patient.gender', 'gender')
        .addSelect('COUNT(*)', 'count')
        .where('patient.gender IS NOT NULL')
        .groupBy('patient.gender')
        .getRawMany();

      const genderDistribution: GenderDistribution[] = genderStats.map(
        (stat) => ({
          gender: stat.gender,
          count: parseInt(stat.count, 10),
          percentage:
            totalPatients > 0
              ? Math.round((parseInt(stat.count, 10) / totalPatients) * 10000) /
                100
              : 0,
        }),
      );

      return {
        ageGroups: ageGroupDistribution,
        genders: genderDistribution,
        averageAge,
        medianAge,
        totalPatients,
      };
    } catch (error) {
      this.logger.error('Error fetching patient demographics', error);
      throw error;
    }
  }

  /**
   * Get recent patients
   * Returns paginated list of recently registered patients
   */
  async getRecentPatients(
    page: number = 1,
    limit: number = 10,
  ): Promise<RecentPatientsDto> {
    try {
      this.logger.log(`Fetching recent patients - page: ${page}, limit: ${limit}`);

      const skip = (page - 1) * limit;

      const [patients, total] = await this.patientRepository.findAndCount({
        order: { created_at: 'DESC' },
        take: limit,
        skip,
      });

      const patientItems: RecentPatientItem[] = patients.map((patient) => ({
        id: patient.id,
        user_id: patient.user_id,
        full_name: patient.full_name,
        date_of_birth: patient.date_of_birth,
        gender: patient.gender,
        address: patient.address,
        created_at: patient.created_at,
        updated_at: patient.updated_at,
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        patients: patientItems,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error('Error fetching recent patients', error);
      throw error;
    }
  }
}