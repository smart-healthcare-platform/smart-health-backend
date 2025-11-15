import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminService } from './admin.service';
import { Appointment } from '../appointment/appointment.entity';
import { AppointmentStatus } from '../appointment/enums/appointment-status.enum';
import { AppointmentType } from '../appointment/enums/appointment-type.enum';
import { AppointmentCategory } from '../appointment/enums/appointment-category.enum';
import { PaymentStatus } from '../appointment/enums/payment-status.enum';

describe('AdminService', () => {
  let service: AdminService;
  let repository: Repository<Appointment>;

  const mockQueryBuilder: any = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
    getCount: jest.fn(),
  };

  const mockRepository = {
    count: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    repository = module.get<Repository<Appointment>>(
      getRepositoryToken(Appointment),
    );

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAppointmentStats', () => {
    it('should return appointment statistics', async () => {
      // Mock repository responses
      mockRepository.count
        .mockResolvedValueOnce(100) // totalAppointments
        .mockResolvedValueOnce(20) // pendingAppointments
        .mockResolvedValueOnce(30) // confirmedAppointments
        .mockResolvedValueOnce(40) // completedAppointments
        .mockResolvedValueOnce(10); // cancelledAppointments

      mockQueryBuilder.getCount
        .mockResolvedValueOnce(15) // newThisMonth
        .mockResolvedValueOnce(5) // newThisWeek
        .mockResolvedValueOnce(8) // scheduledToday
        .mockResolvedValueOnce(25); // appointmentsLast30Days

      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ total: '50000' }) // totalRevenue
        .mockResolvedValueOnce({ total: '10000' }) // revenueThisMonth
        .mockResolvedValueOnce({ avg: '200000' }) // avgFee
        .mockResolvedValueOnce({ type: 'OFFLINE', count: '60' }) // mostCommonType
        .mockResolvedValueOnce({ category: 'NEW', count: '70' }); // mostCommonCategory

      const result = await service.getAppointmentStats();

      expect(result).toBeDefined();
      expect(result.totalAppointments).toBe(100);
      expect(result.pendingAppointments).toBe(20);
      expect(result.confirmedAppointments).toBe(30);
      expect(result.completedAppointments).toBe(40);
      expect(result.cancelledAppointments).toBe(10);
      expect(result.newThisMonth).toBe(15);
      expect(result.newThisWeek).toBe(5);
      expect(result.scheduledToday).toBe(8);
      expect(result.totalRevenue).toBe(50000);
      expect(result.revenueThisMonth).toBe(10000);
      expect(result.averageConsultationFee).toBe(200000);
      expect(result.mostCommonType).toBe('OFFLINE');
      expect(result.mostCommonCategory).toBe('NEW');
      expect(result.completionRate).toBe(40);
      expect(result.cancellationRate).toBe(10);
    });

    it('should handle empty database', async () => {
      mockRepository.count.mockResolvedValue(0);
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getRawOne.mockResolvedValue({ total: null, avg: null });

      const result = await service.getAppointmentStats();

      expect(result.totalAppointments).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.averageConsultationFee).toBe(0);
      expect(result.completionRate).toBe(0);
      expect(result.cancellationRate).toBe(0);
    });

    it('should handle database errors', async () => {
      mockRepository.count.mockRejectedValue(new Error('Database error'));

      await expect(service.getAppointmentStats()).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getAppointmentTrends', () => {
    it('should return daily trends', async () => {
      const mockTrendData = [
        {
          date: '2024-01-01',
          count: '10',
          completed: '8',
          cancelled: '1',
          revenue: '2000000',
        },
        {
          date: '2024-01-02',
          count: '15',
          completed: '12',
          cancelled: '2',
          revenue: '3000000',
        },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockTrendData);
      mockQueryBuilder.getCount.mockResolvedValue(50); // previous period count

      const result = await service.getAppointmentTrends('daily', 30);

      expect(result).toBeDefined();
      expect(result.period).toBe('daily');
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.totalAppointments).toBeGreaterThanOrEqual(0);
      expect(result.totalRevenue).toBeGreaterThanOrEqual(0);
    });

    it('should calculate percentage change correctly', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      mockQueryBuilder.getCount.mockResolvedValue(100); // previous period

      const result = await service.getAppointmentTrends('daily', 7);

      expect(result.percentageChange).toBeDefined();
      expect(typeof result.percentageChange).toBe('number');
    });

    it('should handle weekly period', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      mockQueryBuilder.getCount.mockResolvedValue(0);

      const result = await service.getAppointmentTrends('weekly', 30);

      expect(result.period).toBe('weekly');
    });

    it('should handle monthly period', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      mockQueryBuilder.getCount.mockResolvedValue(0);

      const result = await service.getAppointmentTrends('monthly', 90);

      expect(result.period).toBe('monthly');
    });
  });

  describe('getStatusDistribution', () => {
    it('should return status distribution', async () => {
      mockRepository.count.mockResolvedValue(100);

      const mockStatusStats = [
        { status: 'PENDING', count: '20' },
        { status: 'CONFIRMED', count: '30' },
        { status: 'COMPLETED', count: '40' },
        { status: 'CANCELLED', count: '10' },
      ];

      const mockTypeStats = [
        { type: 'ONLINE', count: '40' },
        { type: 'OFFLINE', count: '60' },
      ];

      const mockCategoryStats = [
        { category: 'NEW', count: '70' },
        { category: 'FOLLOW_UP', count: '30' },
      ];

      const mockPaymentStats = [
        { paymentStatus: 'PAID', count: '60', revenue: '12000000' },
        { paymentStatus: 'UNPAID', count: '30', revenue: '0' },
        { paymentStatus: 'PENDING', count: '10', revenue: '0' },
      ];

      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce(mockStatusStats)
        .mockResolvedValueOnce(mockTypeStats)
        .mockResolvedValueOnce(mockCategoryStats)
        .mockResolvedValueOnce(mockPaymentStats);

      const result = await service.getStatusDistribution();

      expect(result).toBeDefined();
      expect(result.totalAppointments).toBe(100);
      expect(result.statusDistribution).toHaveLength(4);
      expect(result.typeDistribution).toHaveLength(2);
      expect(result.categoryDistribution).toHaveLength(2);
      expect(result.paymentDistribution).toHaveLength(3);
      expect(result.mostCommonStatus).toBe('COMPLETED');
      expect(result.mostCommonType).toBe('OFFLINE');
      expect(result.mostCommonCategory).toBe('NEW');
      expect(result.mostCommonPaymentStatus).toBe('PAID');
    });

    it('should calculate percentages correctly', async () => {
      mockRepository.count.mockResolvedValue(100);

      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([{ status: 'COMPLETED', count: '40' }])
        .mockResolvedValueOnce([{ type: 'ONLINE', count: '25' }])
        .mockResolvedValueOnce([{ category: 'NEW', count: '80' }])
        .mockResolvedValueOnce([
          { paymentStatus: 'PAID', count: '50', revenue: '10000000' },
        ]);

      const result = await service.getStatusDistribution();

      expect(result.statusDistribution[0].percentage).toBe(40);
      expect(result.typeDistribution[0].percentage).toBe(25);
      expect(result.categoryDistribution[0].percentage).toBe(80);
      expect(result.paymentDistribution[0].percentage).toBe(50);
    });

    it('should handle empty database', async () => {
      mockRepository.count.mockResolvedValue(0);
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.getStatusDistribution();

      expect(result.totalAppointments).toBe(0);
      expect(result.statusDistribution).toHaveLength(0);
      expect(result.mostCommonStatus).toBe('N/A');
    });
  });

  describe('getRecentAppointments', () => {
    it('should return paginated recent appointments', async () => {
      const mockAppointments = [
        {
          id: '1',
          doctorId: 'doc1',
          doctorName: 'Dr. John',
          patientId: 'pat1',
          patientName: 'Patient One',
          status: AppointmentStatus.CONFIRMED,
          type: AppointmentType.OFFLINE,
          category: AppointmentCategory.NEW,
          startAt: new Date('2024-01-15T10:00:00'),
          endAt: new Date('2024-01-15T11:00:00'),
          paymentStatus: PaymentStatus.PAID,
          paidAmount: 200000,
          consultationFee: 200000,
          notes: 'Test note',
          createdAt: new Date('2024-01-14'),
          updatedAt: new Date('2024-01-14'),
        },
      ];

      mockRepository.findAndCount.mockResolvedValue([mockAppointments, 25]);

      const result = await service.getRecentAppointments(1, 10);

      expect(result).toBeDefined();
      expect(result.appointments).toHaveLength(1);
      expect(result.total).toBe(25);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
      expect(result.appointments[0].id).toBe('1');
      expect(result.appointments[0].doctorName).toBe('Dr. John');
    });

    it('should handle pagination correctly', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getRecentAppointments(2, 20);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(0);
    });

    it('should map appointment fields correctly', async () => {
      const mockAppointment = {
        id: 'apt123',
        doctorId: 'doc123',
        doctorName: 'Dr. Smith',
        patientId: 'pat123',
        patientName: 'John Doe',
        status: AppointmentStatus.PENDING,
        type: AppointmentType.ONLINE,
        category: AppointmentCategory.FOLLOW_UP,
        startAt: new Date('2024-02-01T14:00:00'),
        endAt: null,
        paymentStatus: PaymentStatus.UNPAID,
        paidAmount: null,
        consultationFee: 150000,
        notes: null,
        createdAt: new Date('2024-01-30'),
        updatedAt: new Date('2024-01-30'),
      };

      mockRepository.findAndCount.mockResolvedValue([[mockAppointment], 1]);

      const result = await service.getRecentAppointments(1, 10);

      const appointment = result.appointments[0];
      expect(appointment.id).toBe('apt123');
      expect(appointment.status).toBe(AppointmentStatus.PENDING);
      expect(appointment.type).toBe(AppointmentType.ONLINE);
      expect(appointment.category).toBe(AppointmentCategory.FOLLOW_UP);
      expect(appointment.paymentStatus).toBe(PaymentStatus.UNPAID);
      expect(appointment.paidAmount).toBeNull();
      expect(appointment.endAt).toBeNull();
      expect(appointment.notes).toBeNull();
    });

    it('should handle database errors', async () => {
      mockRepository.findAndCount.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.getRecentAppointments(1, 10)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});