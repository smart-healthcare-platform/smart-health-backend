import { Injectable, OnModuleInit } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorCertificate } from '../doctor-certificates/doctor-certificates.entity';
import { DoctorAvailability } from '../doctor-availability/doctor-availability.entity';
import { DoctorBlockTime } from '../doctor-block-time/doctor-block-time.entity';
import { DoctorRating } from '../doctor-rating/doctor-rating.entity';
import { AppointmentSlot } from '../appointment-slot/appointment-slot.entity';
import { Gender } from './enums/doctor-gender.enum';

function toVNDate(str: string) {
  const [y, m, d, h = 0, mi = 0, s = 0] =
    str.replace(/[T\-:]/g, ' ')
      .split(' ')
      .map(Number);
  return new Date(y, m - 1, d, h, mi, s);
}

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
    const exists = await this.doctorService.findAllBasic();
    if (exists.data.length > 0) return;

    // ================= DATA GỐC =================
    const doctorsData = [
      {
        full_name: 'Nguyễn Văn An',
        email: 'nguyen.van.an@hospital.com',
        phone: '0901234567',
        gender: Gender.MALE,
        specialty: 'Tim mạch',
        experience_years: 15,
        bio: 'Tiến sĩ, chuyên gia tim mạch với 15 năm kinh nghiệm, từng công tác tại Viện Tim Hà Nội',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        degree: 'Tiến sĩ',
      },
      {
        full_name: 'Trần Thị Bình',
        email: 'tran.thi.binh@hospital.com',
        phone: '0901234568',
        gender: Gender.FEMALE,
        specialty: 'Nhi khoa',
        experience_years: 12,
        bio: 'Bác sĩ chuyên khoa I, chuyên điều trị các bệnh thường gặp ở trẻ em',
        avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
        degree: 'Bác sĩ chuyên khoa I',
      },
      {
        full_name: 'Lê Minh Cường',
        email: 'le.minh.cuong@hospital.com',
        phone: '0901234569',
        gender: Gender.MALE,
        specialty: 'Phẫu thuật thần kinh',
        experience_years: 20,
        bio: 'Giáo sư, Tiến sĩ, chuyên phẫu thuật não và cột sống',
        avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
        degree: 'Tiến sĩ',
      },
      {
        full_name: 'Phạm Thu Dung',
        email: 'pham.thu.dung@hospital.com',
        phone: '0901234570',
        gender: Gender.FEMALE,
        specialty: 'Da liễu',
        experience_years: 8,
        bio: 'Thạc sĩ, chuyên điều trị các bệnh về da và thẩm mỹ da',
        avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
        degree: 'Thạc sĩ',
      },
      {
        full_name: 'Hoàng Văn Em',
        email: 'hoang.van.em@hospital.com',
        phone: '0901234571',
        gender: Gender.MALE,
        specialty: 'Nội tiêu hóa',
        experience_years: 25,
        bio: 'Phó Giáo sư, Tiến sĩ, chuyên gia hàng đầu về bệnh gan',
        avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
        degree: 'Tiến sĩ',
      },
      {
        full_name: 'Vũ Thị Giang',
        email: 'vu.thi.giang@hospital.com',
        phone: '0901234572',
        gender: Gender.FEMALE,
        specialty: 'Sản phụ khoa',
        experience_years: 14,
        bio: 'Bác sĩ chuyên khoa II, chuyên về chăm sóc thai sản và điều trị vô sinh',
        avatar: 'https://randomuser.me/api/portraits/women/6.jpg',
        degree: 'Bác sĩ chuyên khoa II',
      },
      {
        full_name: 'Đặng Quốc Hùng',
        email: 'dang.quoc.hung@hospital.com',
        phone: '0901234573',
        gender: Gender.MALE,
        specialty: 'Chấn thương chỉnh hình',
        experience_years: 11,
        bio: 'Bác sĩ, chuyên điều trị các bệnh lý xương khớp',
        avatar: 'https://randomuser.me/api/portraits/men/7.jpg',
        degree: 'Bác sĩ',
      },
      {
        full_name: 'Bùi Thị Lan',
        email: 'bui.thi.lan@hospital.com',
        phone: '0901234574',
        gender: Gender.FEMALE,
        specialty: 'Mắt',
        experience_years: 9,
        bio: 'Bác sĩ chuyên khoa I, điều trị các bệnh lý về mắt và phẫu thuật mắt',
        avatar: 'https://randomuser.me/api/portraits/women/8.jpg',
        degree: 'Bác sĩ chuyên khoa I',
      },
      {
        full_name: 'Ngô Văn Minh',
        email: 'ngo.van.minh@hospital.com',
        phone: '0901234575',
        gender: Gender.MALE,
        specialty: 'Ung bướu',
        experience_years: 18,
        bio: 'Tiến sĩ, chuyên điều trị các loại ung thư bằng hóa trị và xạ trị',
        avatar: 'https://randomuser.me/api/portraits/men/9.jpg',
        degree: 'Tiến sĩ',
      },
      {
        full_name: 'Lý Thị Nga',
        email: 'ly.thi.nga@hospital.com',
        phone: '0901234576',
        gender: Gender.FEMALE,
        specialty: 'Tai mũi họng',
        experience_years: 10,
        bio: 'Bác sĩ, điều trị các bệnh lý về đường hô hấp trên',
        avatar: 'https://randomuser.me/api/portraits/women/10.jpg',
        degree: 'Bác sĩ',
      },
      {
        full_name: 'Trương Văn Ơn',
        email: 'truong.van.on@hospital.com',
        phone: '0901234577',
        gender: Gender.MALE,
        specialty: 'Hô hấp',
        experience_years: 13,
        bio: 'Bác sĩ chuyên khoa I, điều trị các bệnh phổi và đường hô hấp',
        avatar: 'https://randomuser.me/api/portraits/men/11.jpg',
        degree: 'Bác sĩ chuyên khoa I',
      },
      {
        full_name: 'Đinh Thị Phương',
        email: 'dinh.thi.phuong@hospital.com',
        phone: '0901234578',
        gender: Gender.FEMALE,
        specialty: 'Thận - Tiết niệu',
        experience_years: 16,
        bio: 'Bác sĩ chuyên khoa II, điều trị các bệnh lý về thận và đường tiết niệu',
        avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
        degree: 'Bác sĩ chuyên khoa II',
      },
      {
        full_name: 'Hà Minh Quang',
        email: 'ha.minh.quang@hospital.com',
        phone: '0901234579',
        gender: Gender.MALE,
        specialty: 'Tâm thần',
        experience_years: 7,
        bio: 'Bác sĩ, chuyên điều trị các rối loạn tâm lý và tâm thần',
        avatar: 'https://randomuser.me/api/portraits/men/13.jpg',
        degree: 'Bác sĩ',
      },
      {
        full_name: 'Võ Thị Rụt',
        email: 'vo.thi.rut@hospital.com',
        phone: '0901234580',
        gender: Gender.FEMALE,
        specialty: 'Nội tiết',
        experience_years: 12,
        bio: 'Thạc sĩ, điều trị tiểu đường và các rối loạn nội tiết',
        avatar: 'https://randomuser.me/api/portraits/women/14.jpg',
        degree: 'Thạc sĩ',
      },
      {
        full_name: 'Mai Văn Sơn',
        email: 'mai.van.son@hospital.com',
        phone: '0901234581',
        gender: Gender.MALE,
        specialty: 'Gây mê hồi sức',
        experience_years: 22,
        bio: 'Phó Giáo sư, chuyên khoa gây mê hồi sức, giàu kinh nghiệm trong các ca phẫu thuật phức tạp',
        avatar: 'https://randomuser.me/api/portraits/men/15.jpg',
        degree: 'Tiến sĩ',
      },
      {
        full_name: 'Lại Thị Thu',
        email: 'lai.thi.thu@hospital.com',
        phone: '0901234582',
        gender: Gender.FEMALE,
        specialty: 'Dinh dưỡng',
        experience_years: 6,
        bio: 'Bác sĩ, tư vấn chế độ ăn và điều trị các bệnh liên quan dinh dưỡng',
        avatar: 'https://randomuser.me/api/portraits/women/16.jpg',
        degree: 'Bác sĩ',
      },
      {
        full_name: 'Phan Văn Út',
        email: 'phan.van.ut@hospital.com',
        phone: '0901234583',
        gender: Gender.MALE,
        specialty: 'Cấp cứu',
        experience_years: 14,
        bio: 'Bác sĩ chuyên khoa I, chuyên xử lý các tình huống cấp cứu và chăm sóc tích cực',
        avatar: 'https://randomuser.me/api/portraits/men/17.jpg',
        degree: 'Bác sĩ chuyên khoa I',
      },
      {
        full_name: 'Chu Thị Vân',
        email: 'chu.thi.van@hospital.com',
        phone: '0901234584',
        gender: Gender.FEMALE,
        specialty: 'Phục hồi chức năng',
        experience_years: 8,
        bio: 'Bác sĩ, chuyên vật lý trị liệu sau chấn thương',
        avatar: 'https://randomuser.me/api/portraits/women/18.jpg',
        degree: 'Bác sĩ',
      },
      {
        full_name: 'Đỗ Văn Xuân',
        email: 'do.van.xuan@hospital.com',
        phone: '0901234585',
        gender: Gender.MALE,
        specialty: 'Tiêu hóa',
        experience_years: 19,
        bio: 'Tiến sĩ, chuyên nội soi và điều trị bệnh lý đường tiêu hóa',
        avatar: 'https://randomuser.me/api/portraits/men/19.jpg',
        degree: 'Tiến sĩ',
      },
      {
        full_name: 'Lương Thị Yến',
        email: 'luong.thi.yen@hospital.com',
        phone: '0901234586',
        gender: Gender.FEMALE,
        specialty: 'Truyền nhiễm',
        experience_years: 11,
        bio: 'Bác sĩ chuyên khoa I, điều trị các bệnh nhiễm trùng và dịch bệnh',
        avatar: 'https://randomuser.me/api/portraits/women/20.jpg',
        degree: 'Bác sĩ chuyên khoa I',
      },
    ];

    const weekDays: Record<string, number> = {
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
    };

    // ================= LOOP SEED =================
    for (const [index, d] of doctorsData.entries()) {
      const doctor = await this.doctorService.create({
        full_name: d.full_name,
        user_id: 'd54ad561-a9fb-473a-ba4f-086e2c369093',
        phone: d.phone,
        gender: d.gender,
        avatar: d.avatar,
        experience_years: d.experience_years,
        bio: d.bio,
        active: true,
        date_of_birth: `${1970 + Math.floor(Math.random() * 30)}-${String(
          Math.floor(Math.random() * 12) + 1
        ).padStart(2, '0')}-${String(
          Math.floor(Math.random() * 28) + 1
        ).padStart(2, '0')}`,
      });

      // CERT
      await this.certRepo.save([
        this.certRepo.create({
          doctor_id: doctor.id,
          type: 'degree',
          title: d.degree,
          field: d.specialty,
          graduation_year: toVNDate(
            `${2005 + Math.floor(Math.random() * 15)}-06-01`
          ),
          certificate_file: `/uploads/certs/${doctor.id}_degree.pdf`,
        }),
        this.certRepo.create({
          doctor_id: doctor.id,
          type: 'license',
          title: `Giấy phép hành nghề số ${10000 + index}`,
          issued_date: toVNDate(
            `${2010 + Math.floor(Math.random() * 10)}-01-01`
          ),
          expiry_date: toVNDate(
            `${2030 + Math.floor(Math.random() * 5)}-01-01`
          ),
          certificate_file: `/uploads/certs/${doctor.id}_license.pdf`,
        }),
      ]);

      // AVAILABILITY + SLOTS
      const workDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const selectedDays = workDays
        .sort(() => 0.5 - Math.random())
        .slice(0, 3 + Math.floor(Math.random() * 3));

      for (const day of selectedDays) {
        const shifts: Array<'morning' | 'afternoon' | 'full'> = [
          'morning',
          'afternoon',
          'full',
        ];
        const shift = shifts[Math.floor(Math.random() * shifts.length)];

        await this.availRepo.save(
          this.availRepo.create({
            doctor_id: doctor.id,
            day_of_week: day,
            shift,
          }),
        );

        const startHour =
          shift === 'morning' ? 8 : shift === 'afternoon' ? 13 : 8;
        const endHour =
          shift === 'morning' ? 12 : shift === 'afternoon' ? 17 : 17;

        const start = toVNDate('2025-11-01');
        const end = toVNDate('2025-11-30 23:59:59');

        for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
          if (dt.getDay() !== weekDays[day]) continue;

          let slotTime = new Date(dt);
          slotTime.setHours(startHour, 0, 0, 0);

          while (slotTime.getHours() < endHour) {
            const startSlot = new Date(slotTime);
            const endSlot = new Date(startSlot.getTime() + 50 * 60000);

            if (endSlot.getHours() > endHour) break;

            await this.slotRepo.save(
              this.slotRepo.create({
                doctor_id: doctor.id,
                start_time: startSlot,
                end_time: endSlot,
                status: 'available',
              }),
            );

            slotTime = new Date(startSlot.getTime() + 60 * 60000);
          }
        }
      }

      // BLOCK
      await this.blockRepo.save(
        this.blockRepo.create({
          doctor_id: doctor.id,
          start_time: toVNDate('2025-11-12 12:00:00'),
          end_time: toVNDate('2025-11-12 13:00:00'),
          reason: 'Nghỉ trưa',
        }),
      );

      // RATING
      const ratings = [
        { rating: 5, comment: 'Bác sĩ rất tận tâm', patient_id: `P${index}01` },
        { rating: 4, comment: 'Khám kỹ, giải thích rõ', patient_id: `P${index}02` },
        { rating: 5, comment: 'Rất hài lòng', patient_id: `P${index}03` },
      ];

      await this.ratingRepo.save(
        ratings.map((r) => this.ratingRepo.create({ ...r, doctor_id: doctor.id })),
      );

      console.log(`✔ Created doctor: ${d.full_name}`);
    }

    console.log('🎉 DONE: Seed 20 doctors!');
  }
}
