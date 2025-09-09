import { Injectable, OnModuleInit } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DoctorCertificate } from '../doctor-certificates/doctor-certificates.entity';
import { DoctorAvailability } from '../doctor-availability/doctor-availability.entity';
import { DoctorBlockTime } from '../doctor-block-time/doctor-block-time.entity';
import { DoctorRating } from '../doctor-rating/doctor-rating.entity';
import { AppointmentSlot } from '../appointment-slot/appointment-slot.entity';

@Injectable()
export class DoctorSeed implements OnModuleInit {
  constructor(
    private readonly doctorService: DoctorService,
    @InjectRepository(DoctorCertificate)
    private certRepo: Repository<DoctorCertificate>,
    @InjectRepository(DoctorAvailability)
    private availRepo: Repository<DoctorAvailability>,
    @InjectRepository(DoctorBlockTime)
    private blockRepo: Repository<DoctorBlockTime>,
    @InjectRepository(DoctorRating)
    private ratingRepo: Repository<DoctorRating>,
    @InjectRepository(AppointmentSlot)
    private slotRepo: Repository<AppointmentSlot>,
  ) {}

  async onModuleInit() {
    const doctors = await this.doctorService.findAllBasic();
    if (doctors.length > 0) return;

    // ------------------ Bác sĩ mẫu ------------------
    const doctor = await this.doctorService.create({
      full_name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '0123456789',
      gender: 'male',
      date_of_birth: '1980-05-15',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      specialty: 'Tim mạch',
      experience_years: 12,
      bio: 'Chuyên gia tim mạch với 12 năm kinh nghiệm',
      active: true,
    });

    // Certificates (bằng cấp + giấy phép)
    await this.certRepo.save([
      this.certRepo.create({
        doctor_id: doctor.id,
        type: 'degree',
        title: 'Tiến sĩ',
        field: 'Tim mạch',
        graduation_year: new Date('2010-06-01'),
        certificate_file: '/uploads/certs/tsym.pdf',
      }),
      this.certRepo.create({
        doctor_id: doctor.id,
        type: 'license',
        title: 'Giấy phép hành nghề số 1234',
        issued_date: new Date('2010-07-01'),
        expiry_date: new Date('2030-07-01'),
        certificate_file: '/uploads/certs/gplh.pdf',
      }),
    ]);

    // Availability (làm việc thứ 2, 4, 6 từ 9h-17h)
    await this.availRepo.save([
      this.availRepo.create({
        doctor_id: doctor.id,
        day_of_week: 'mon',
        start_time: '09:00:00',
        end_time: '17:00:00',
      }),
      this.availRepo.create({
        doctor_id: doctor.id,
        day_of_week: 'wed',
        start_time: '09:00:00',
        end_time: '17:00:00',
      }),
      this.availRepo.create({
        doctor_id: doctor.id,
        day_of_week: 'fri',
        start_time: '09:00:00',
        end_time: '17:00:00',
      }),
    ]);

    // BlockTime (nghỉ trưa ngày 2025-09-10 từ 12h-13h)
    await this.blockRepo.save(
      this.blockRepo.create({
        doctor_id: doctor.id,
        start_time: new Date('2025-09-10T12:00:00'),
        end_time: new Date('2025-09-10T13:00:00'),
        reason: 'Nghỉ trưa',
      }),
    );

    // Ratings
    await this.ratingRepo.save([
      this.ratingRepo.create({
        doctor_id: doctor.id,
        rating: 5,
        comment: 'Rất nhiệt tình, chuyên môn cao',
        patient_id: 'P001',
      }),
      this.ratingRepo.create({
        doctor_id: doctor.id,
        rating: 4,
        comment: 'Hài lòng với tư vấn',
        patient_id: 'P002',
      }),
    ]);

    // Appointment slots
    await this.slotRepo.save([
      this.slotRepo.create({
        doctor_id: doctor.id,
        start_time: new Date('2025-09-11T09:00:00'),
        end_time: new Date('2025-09-11T10:00:00'),
        status: 'available',
      }),
      this.slotRepo.create({
        doctor_id: doctor.id,
        start_time: new Date('2025-09-11T10:00:00'),
        end_time: new Date('2025-09-11T11:00:00'),
        status: 'booked',
        patient_id: 'P003',
      }),
    ]);

    console.log('✅ Seeded doctor with certificates, availability, blocktime, ratings, and slots!');
  }
}
