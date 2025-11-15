import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminService } from '../admin.service';
import { Patient } from '../../patient/patient.entity';

describe('AdminService', () => {
  let service: AdminService;
  let repository: Repository<Patient>;

  const mockPatientRepository = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
    findAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getRepositoryToken(Patient),
          useValue: mockPatientRepository,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    repository = module.get<Repository<Patient>>(getRepositoryToken(Patient));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPatientStats', () => {
    it('should return patient statistics', async () => {
      // Mock total patients
      mockPatientRepository.count.mockResolvedValue(1000);

      // Mock query builder for various counts
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      };

      mockPatientRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Mock active patients (90 days)
      mockQueryBuilder.getCount
        .mockResolvedValueOnce(800) // activePatients
        .mockResolvedValueOnce(50) // newThisMonth
        .mockResolvedValueOnce(15) // newThisWeek
        .mockResolvedValueOnce(40); // newLastMonth

      // Mock patients with DOB for average age
      mockQueryBuilder.getRawMany.mockResolvedValueOnce([
        { patient_date_of_birth: new Date('1990-01-01') },
        { patient_date_of_birth: new Date('1985-06-15') },
        { patient_date_of_birth: new Date('1995-12-20') },
      ]);

      // Mock gender stats
      mockQueryBuilder.getRawMany.mockResolvedValueOnce([
        { gender: 'Male', count: '450' },
        { gender: 'Female', count: '500' },
        { gender: 'Other', count: '50' },
      ]);

      const result = await service.getPatientStats();

      expect(result).toBeDefined();
      expect(result.totalPatients).toBe(1000);
      expect(result.activePatients).toBe(800);
      expect(result.newThisMonth).toBe(50);
      expect(result.newThisWeek).toBe(15);
      expect(result.growthRate).toBeGreaterThan(0);
      expect(result.maleCount).toBe(450);
      expect(result.femaleCount).toBe(500);
      expect(result.otherGenderCount).toBe(50);
    });

    it('should handle zero growth rate', async () => {
      mockPatientRepository.count.mockResolvedValue(100);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      };

      mockPatientRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      mockQueryBuilder.getCount
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(0) // newThisMonth
        .mockResolvedValueOnce(0) // newThisWeek
        .mockResolvedValueOnce(0); // newLastMonth

      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getPatientStats();

      expect(result.growthRate).toBe(0);
      expect(result.averageAge).toBe(0);
    });
  });

  describe('getPatientGrowth', () => {
    it('should return daily growth data', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
        getCount: jest.fn(),
      };

      mockPatientRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Mock count before start date
      mockQueryBuilder.getCount.mockResolvedValue(900);

      // Mock daily counts
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      mockQueryBuilder.getRawMany.mockResolvedValue([
        { date: yesterday.toISOString().split('T')[0], count: '5' },
        { date: today.toISOString().split('T')[0], count: '3' },
      ]);

      const result = await service.getPatientGrowth('daily', 7);

      expect(result).toBeDefined();
      expect(result.period).toBe('daily');
      expect(result.data).toBeInstanceOf(Array);
      expect(result.totalGrowth).toBeGreaterThanOrEqual(0);
      expect(result.percentageChange).toBeDefined();
    });

    it('should return weekly growth data', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
        getCount: jest.fn(),
      };

      mockPatientRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getCount.mockResolvedValue(500);
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.getPatientGrowth('weekly', 30);

      expect(result.period).toBe('weekly');
      expect(result.data).toBeInstanceOf(Array);
    });

    it('should return monthly growth data', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
        getCount: jest.fn(),
      };

      mockPatientRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getCount.mockResolvedValue(300);
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.getPatientGrowth('monthly', 180);

      expect(result.period).toBe('monthly');
      expect(result.data).toBeInstanceOf(Array);
    });
  });

  describe('getPatientDemographics', () => {
    it('should return demographics breakdown', async () => {
      mockPatientRepository.count.mockResolvedValue(1000);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      };

      mockPatientRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Mock patients with DOB
      const mockPatientsWithDob = [
        { patient_date_of_birth: new Date('2010-01-01'), patient_gender: 'Male' },
        { patient_date_of_birth: new Date('1995-01-01'), patient_gender: 'Female' },
        { patient_date_of_birth: new Date('1980-01-01'), patient_gender: 'Male' },
        { patient_date_of_birth: new Date('1970-01-01'), patient_gender: 'Female' },
        { patient_date_of_birth: new Date('1950-01-01'), patient_gender: 'Other' },
      ];

      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce(mockPatientsWithDob)
        .mockResolvedValueOnce([
          { gender: 'Male', count: '400' },
          { gender: 'Female', count: '550' },
          { gender: 'Other', count: '50' },
        ]);

      const result = await service.getPatientDemographics();

      expect(result).toBeDefined();
      expect(result.ageGroups).toBeInstanceOf(Array);
      expect(result.ageGroups.length).toBe(5);
      expect(result.genders).toBeInstanceOf(Array);
      expect(result.averageAge).toBeGreaterThan(0);
      expect(result.medianAge).toBeGreaterThan(0);
      expect(result.totalPatients).toBe(1000);
    });

    it('should handle empty demographics data', async () => {
      mockPatientRepository.count.mockResolvedValue(0);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      };

      mockPatientRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getPatientDemographics();

      expect(result.totalPatients).toBe(0);
      expect(result.averageAge).toBe(0);
      expect(result.medianAge).toBe(0);
      expect(result.ageGroups).toBeInstanceOf(Array);
    });
  });

  describe('getRecentPatients', () => {
    it('should return paginated recent patients', async () => {
      const mockPatients = [
        {
          id: 'uuid-1',
          user_id: 'user-1',
          full_name: 'John Doe',
          date_of_birth: new Date('1990-01-01'),
          gender: 'Male',
          address: '123 Main St',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'uuid-2',
          user_id: 'user-2',
          full_name: 'Jane Smith',
          date_of_birth: new Date('1985-06-15'),
          gender: 'Female',
          address: '456 Oak Ave',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockPatientRepository.findAndCount.mockResolvedValue([mockPatients, 100]);

      const result = await service.getRecentPatients(1, 10);

      expect(result).toBeDefined();
      expect(result.patients).toHaveLength(2);
      expect(result.total).toBe(100);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(10);
      expect(result.patients[0].id).toBe('uuid-1');
      expect(result.patients[0].full_name).toBe('John Doe');
    });

    it('should handle pagination correctly', async () => {
      mockPatientRepository.findAndCount.mockResolvedValue([[], 50]);

      const result = await service.getRecentPatients(3, 20);

      expect(result.page).toBe(3);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(3);
      expect(mockPatientRepository.findAndCount).toHaveBeenCalledWith({
        order: { created_at: 'DESC' },
        take: 20,
        skip: 40, // (3-1) * 20
      });
    });

    it('should return empty array when no patients exist', async () => {
      mockPatientRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getRecentPatients(1, 10);

      expect(result.patients).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should throw error when database fails', async () => {
      mockPatientRepository.count.mockRejectedValue(new Error('Database error'));

      await expect(service.getPatientStats()).rejects.toThrow('Database error');
    });

    it('should throw error on query builder failure', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockRejectedValue(new Error('Query failed')),
      };

      mockPatientRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.getPatientGrowth('daily', 30)).rejects.toThrow();
    });
  });
});