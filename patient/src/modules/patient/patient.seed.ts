import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './patient.entity';
import { Gender } from './enums/patient-gender.enum';

// Random date of birth
function randomDOB() {
  const year = 1960 + Math.floor(Math.random() * 40); // 1960–2000
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Fake data
const patientSeeds = [
  { full_name: 'Nguyễn Văn An', gender: Gender.MALE, address: 'Hà Nội', phone: '0912345678' },
  { full_name: 'Trần Thị Bình', gender: Gender.FEMALE, address: 'Hồ Chí Minh', phone: '0966123456' },
  { full_name: 'Lê Minh Cường', gender: Gender.MALE, address: 'Đà Nẵng', phone: '0987456123' },
  { full_name: 'Phạm Thu Dung', gender: Gender.FEMALE, address: 'Huế', phone: '0923456712' },
  { full_name: 'Hoàng Văn Em', gender: Gender.MALE, address: 'Hải Phòng', phone: '0977778888' },
  { full_name: 'Vũ Thị Giang', gender: Gender.FEMALE, address: 'Nam Định', phone: '0911555333' },
  { full_name: 'Đặng Quốc Hùng', gender: Gender.MALE, address: 'Cần Thơ', phone: '0932123456' },
  { full_name: 'Bùi Thị Lan', gender: Gender.FEMALE, address: 'Quảng Ngãi', phone: '0944332211' },
  { full_name: 'Ngô Văn Minh', gender: Gender.MALE, address: 'Long An', phone: '0988112233' },
  { full_name: 'Lý Thị Nga', gender: Gender.FEMALE, address: 'Quảng Nam', phone: '0905432123' },
  { full_name: 'Trương Văn Ơn', gender: Gender.MALE, address: 'Nghệ An', phone: '0912349988' },
  { full_name: 'Đinh Thị Phương', gender: Gender.FEMALE, address: 'Bình Dương', phone: '0954123456' },
  { full_name: 'Hà Minh Quang', gender: Gender.MALE, address: 'Đắk Lắk', phone: '0933445566' },
  { full_name: 'Võ Thị Rụt', gender: Gender.FEMALE, address: 'Sóc Trăng', phone: '0991122334' },
  { full_name: 'Mai Văn Sơn', gender: Gender.MALE, address: 'Tiền Giang', phone: '0986644221' },
  { full_name: 'Lại Thị Thu', gender: Gender.FEMALE, address: 'Gia Lai', phone: '0911778899' },
  { full_name: 'Phan Văn Út', gender: Gender.MALE, address: 'Trà Vinh', phone: '0977355332' },
  { full_name: 'Chu Thị Vân', gender: Gender.FEMALE, address: 'Bắc Giang', phone: '0922334455' },
  { full_name: 'Đỗ Văn Xuân', gender: Gender.MALE, address: 'Hà Tĩnh', phone: '0909877654' },
  { full_name: 'Lương Thị Yến', gender: Gender.FEMALE, address: 'Kiên Giang', phone: '0933112244' },
];

@Injectable()
export class PatientSeed implements OnModuleInit {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  async onModuleInit() {
    const count = await this.patientRepo.count();
    if (count > 5) return;

    for (const p of patientSeeds) {
      await this.patientRepo.save(
        this.patientRepo.create({
          user_id: crypto.randomUUID(), 
          full_name: p.full_name,
          gender: p.gender,
          phone: p.phone,
          address: p.address,
          date_of_birth: randomDOB(),
        }),
      );

      console.log(`✅ Tạo bệnh nhân: ${p.full_name}`);
    }

    console.log('🎉 Seed 20 bệnh nhân hoàn tất!');
  }
}
