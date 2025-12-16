import { Injectable, OnModuleInit } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DoctorCertificate } from '../doctor-certificates/doctor-certificates.entity';
import { DoctorWeeklyAvailability } from '../doctor-schedule/entity/doctor-weekly-availability.entity';
import { DoctorBlockTime } from '../doctor-schedule/entity/doctor-block-time.entity';
import { DoctorRating } from '../doctor-rating/doctor-rating.entity';
import { AppointmentSlot } from '../appointment-slot/appointment-slot.entity';
import { Gender } from './enums/doctor-gender.enum';
import { CertificateType } from '../doctor-certificates/enums/certificate-type.enum';
import { DayOfWeek } from '../doctor-schedule/dto/create-doctor-weekly-availability.dto';
import { AcademicDegree } from '../doctor-certificates/enums/academic_degree.enum';
import { DoctorCertificateService } from '../doctor-certificates/doctor-certificates.service';

function toVNDate(str: string) {
  const [y, m, d, h = 0, mi = 0, s = 0] = str
    .replace(/[T\-:]/g, ' ')
    .split(' ')
    .map(Number);
  return new Date(y, m - 1, d, h, mi, s);
}

@Injectable()
export class DoctorSeed implements OnModuleInit {
  constructor(
    private readonly doctorService: DoctorService,
    private readonly doctorCertificateService: DoctorCertificateService,

    @InjectRepository(DoctorWeeklyAvailability)
    private availRepo: Repository<DoctorWeeklyAvailability>,

    @InjectRepository(DoctorBlockTime)
    private blockRepo: Repository<DoctorBlockTime>,

    @InjectRepository(DoctorRating)
    private ratingRepo: Repository<DoctorRating>,

    @InjectRepository(AppointmentSlot)
    private slotRepo: Repository<AppointmentSlot>,
  ) { }

  async onModuleInit() {
    const exists = await this.doctorService.findAllBasic();
    if (exists.data.length > 0) return;

    const doctorsData = [
      { full_name: 'Nguyễn Văn An', gender: Gender.MALE, date_of_birth: '1980-05-12', phone: '0901234567', avatar: 'https://randomuser.me/api/portraits/men/1.jpg', experience_years: 15, bio: 'Chuyên gia tim mạch với hơn 15 năm kinh nghiệm.', active: true, email: 'nguyen.van.an@hospital.com', degree: AcademicDegree.SPECIALIST_I },
      { full_name: 'Trần Thị Bình', gender: Gender.FEMALE, date_of_birth: '1985-07-20', phone: '0901234568', avatar: 'https://randomuser.me/api/portraits/women/2.jpg', experience_years: 12, bio: 'Chuyên gia tim mạch với hơn 12 năm kinh nghiệm.', active: true, email: 'tran.thi.binh@hospital.com', degree: AcademicDegree.MASTER },
      { full_name: 'Lê Minh Cường', gender: Gender.MALE, date_of_birth: '1978-09-15', phone: '0901234569', avatar: 'https://randomuser.me/api/portraits/men/3.jpg', experience_years: 20, bio: 'Phẫu thuật tim mạch.', active: true, email: 'le.minh.cuong@hospital.com', degree: AcademicDegree.SPECIALIST_II },
      { full_name: 'Phạm Thu Dung', gender: Gender.FEMALE, date_of_birth: '1990-02-18', phone: '0901234570', avatar: 'https://randomuser.me/api/portraits/women/4.jpg', experience_years: 8, bio: 'Điều trị bệnh tim mạch.', active: true, email: 'pham.thu.dung@hospital.com', degree: AcademicDegree.MD },
      { full_name: 'Hoàng Văn Em', gender: Gender.MALE, date_of_birth: '1975-03-30', phone: '0901234571', avatar: 'https://randomuser.me/api/portraits/men/5.jpg', experience_years: 25, bio: 'Nội tim mạch.', active: true, email: 'hoang.van.em@hospital.com', degree: AcademicDegree.SPECIALIST_II },
      { full_name: 'Vũ Thị Giang', gender: Gender.FEMALE, date_of_birth: '1984-08-10', phone: '0901234572', avatar: 'https://randomuser.me/api/portraits/women/6.jpg', experience_years: 14, bio: 'Theo dõi bệnh nhân tim mạch.', active: true, email: 'vu.thi.giang@hospital.com', degree: AcademicDegree.SPECIALIST_I },
      { full_name: 'Đặng Quốc Hùng', gender: Gender.MALE, date_of_birth: '1987-11-02', phone: '0901234573', avatar: 'https://randomuser.me/api/portraits/men/7.jpg', experience_years: 11, bio: 'Tim mạch can thiệp.', active: true, email: 'dang.quoc.hung@hospital.com', degree: AcademicDegree.MASTER },
      { full_name: 'Bùi Thị Lan', gender: Gender.FEMALE, date_of_birth: '1989-06-21', phone: '0901234574', avatar: 'https://randomuser.me/api/portraits/women/8.jpg', experience_years: 9, bio: 'Tim mạch nhi.', active: true, email: 'bui.thi.lan@hospital.com', degree: AcademicDegree.MD },
      { full_name: 'Ngô Văn Minh', gender: Gender.MALE, date_of_birth: '1979-04-14', phone: '0901234575', avatar: 'https://randomuser.me/api/portraits/men/9.jpg', experience_years: 18, bio: 'Theo dõi bệnh nhân suy tim.', active: true, email: 'ngo.van.minh@hospital.com', degree: AcademicDegree.SPECIALIST_I },
      { full_name: 'Lý Thị Nga', gender: Gender.FEMALE, date_of_birth: '1986-12-02', phone: '0901234576', avatar: 'https://randomuser.me/api/portraits/women/10.jpg', experience_years: 10, bio: 'Điều trị rối loạn nhịp tim.', active: true, email: 'ly.thi.nga@hospital.com', degree: AcademicDegree.MD },
      { full_name: 'Trương Văn Ơn', gender: Gender.MALE, date_of_birth: '1982-03-11', phone: '0901234577', avatar: 'https://randomuser.me/api/portraits/men/11.jpg', experience_years: 13, bio: 'Điều trị bệnh van tim.', active: true, email: 'truong.van.on@hospital.com', degree: AcademicDegree.SPECIALIST_I },
      { full_name: 'Đinh Thị Phương', gender: Gender.FEMALE, date_of_birth: '1985-09-17', phone: '0901234578', avatar: 'https://randomuser.me/api/portraits/women/12.jpg', experience_years: 16, bio: 'Bệnh mạch vành.', active: true, email: 'dinh.thi.phuong@hospital.com', degree: AcademicDegree.SPECIALIST_I },
      { full_name: 'Hà Minh Quang', gender: Gender.MALE, date_of_birth: '1992-01-22', phone: '0901234579', avatar: 'https://randomuser.me/api/portraits/men/13.jpg', experience_years: 7, bio: 'Theo dõi bệnh nhân sau phẫu thuật tim.', active: true, email: 'ha.minh.quang@hospital.com', degree: AcademicDegree.BACHELOR },
      { full_name: 'Võ Thị Rụt', gender: Gender.FEMALE, date_of_birth: '1988-10-05', phone: '0901234580', avatar: 'https://randomuser.me/api/portraits/women/14.jpg', experience_years: 12, bio: 'Điều trị bệnh tim mạch mãn tính.', active: true, email: 'vo.thi.rut@hospital.com', degree: AcademicDegree.MASTER },
      { full_name: 'Mai Văn Sơn', gender: Gender.MALE, date_of_birth: '1973-07-19', phone: '0901234581', avatar: 'https://randomuser.me/api/portraits/men/15.jpg', experience_years: 22, bio: 'Chăm sóc bệnh nhân nhồi máu cơ tim.', active: true, email: 'mai.van.son@hospital.com', degree: AcademicDegree.SPECIALIST_II },
      { full_name: 'Lại Thị Thu', gender: Gender.FEMALE, date_of_birth: '1993-03-10', phone: '0901234582', avatar: 'https://randomuser.me/api/portraits/women/16.jpg', experience_years: 6, bio: 'Tư vấn sức khỏe tim mạch.', active: true, email: 'lai.thi.thu@hospital.com', degree: AcademicDegree.BACHELOR },
      { full_name: 'Phan Văn Út', gender: Gender.MALE, date_of_birth: '1984-04-09', phone: '0901234583', avatar: 'https://randomuser.me/api/portraits/men/17.jpg', experience_years: 14, bio: 'Chuyên gia tim mạch cấp cứu.', active: true, email: 'phan.van.ut@hospital.com', degree: AcademicDegree.SPECIALIST_I },
      { full_name: 'Chu Thị Vân', gender: Gender.FEMALE, date_of_birth: '1991-09-25', phone: '0901234584', avatar: 'https://randomuser.me/api/portraits/women/18.jpg', experience_years: 8, bio: 'Tim mạch phục hồi chức năng.', active: true, email: 'chu.thi.van@hospital.com', degree: AcademicDegree.MD },
      { full_name: 'Đỗ Văn Xuân', gender: Gender.MALE, date_of_birth: '1979-11-08', phone: '0901234585', avatar: 'https://randomuser.me/api/portraits/men/19.jpg', experience_years: 19, bio: 'Nội soi tim mạch.', active: true, email: 'do.van.xuan@hospital.com', degree: AcademicDegree.SPECIALIST_I },
      { full_name: 'Lương Thị Yến', gender: Gender.FEMALE, date_of_birth: '1986-02-14', phone: '0901234586', avatar: 'https://randomuser.me/api/portraits/women/20.jpg', experience_years: 11, bio: 'Truyền nhiễm tim mạch.', active: true, email: 'luong.thi.yen@hospital.com', degree: AcademicDegree.MASTER },
    ];

    const workDays: DayOfWeek[] = [
      DayOfWeek.MON,
      DayOfWeek.TUE,
      DayOfWeek.WED,
      DayOfWeek.THU,
      DayOfWeek.FRI,
      DayOfWeek.SAT,
    ];

    for (const [index, d] of doctorsData.entries()) {
      // Tạo doctor
      const doctor = await this.doctorService.create({
        full_name: d.full_name,
        phone: d.phone,
        gender: d.gender,
        avatar: d.avatar,
        experience_years: d.experience_years,
        bio: d.bio,
        date_of_birth: d.date_of_birth,
        email: d.email,
        room_number: String(index + 1),
      });

      // ================= CERTIFICATES =================
      await this.doctorCertificateService.create({
        doctor_id: doctor.id,
        type: CertificateType.DEGREE,
        academic_degree: d.degree,
        field: 'Cardiologist',
        graduation_year: 2010,
        certificate_file: `/uploads/certs/${doctor.id}_degree.pdf`
      });

      await this.doctorCertificateService.create({
        doctor_id: doctor.id,
        type: CertificateType.LICENSE,
        license_number: `${10000 + index}`,
        issued_by: 'Bộ Y Tế',
        issued_date: toVNDate('2015-01-01'),
        expiry_date: toVNDate('2030-01-01'),
        certificate_file: `/uploads/certs/${doctor.id}_license.pdf`,
      });

      // ================= AVAILABILITY & SLOTS =================
      const selectedDays = workDays.slice(0, 3 + Math.floor(Math.random() * 3));

      for (const day of selectedDays) {
        await this.availRepo.save(
          this.availRepo.create({
            doctor: { id: doctor.id },
            day_of_week: day,
            start_time: '08:00',
            end_time: '17:00',
          }),
        );

        for (const shift of ['morning', 'afternoon']) {
          const startHour =
            shift === 'morning' ? 8 : shift === 'afternoon' ? 13 : 8;
          const endHour =
            shift === 'morning' ? 12 : shift === 'afternoon' ? 17 : 17;

          const start = toVNDate('2025-12-01');
          const end = toVNDate('2025-12-31 23:59:59');

          for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
            // Check đúng thứ
            if (dt.getDay() !== (
              {
                [DayOfWeek.SUN]: 0,
                [DayOfWeek.MON]: 1,
                [DayOfWeek.TUE]: 2,
                [DayOfWeek.WED]: 3,
                [DayOfWeek.THU]: 4,
                [DayOfWeek.FRI]: 5,
                [DayOfWeek.SAT]: 6,
              } as Record<DayOfWeek, number>
            )[day]) continue;

            let slotTime = new Date(dt);
            slotTime.setHours(startHour, 0, 0, 0);

            while (slotTime.getHours() < endHour) {
              const startSlot = new Date(slotTime);
              const endSlot = new Date(startSlot.getTime() + 50 * 60000);

              if (endSlot.getHours() > endHour) break;

              await this.slotRepo.save(
                this.slotRepo.create({
                  doctor: { id: doctor.id },
                  start_time: startSlot,
                  end_time: endSlot,
                  status: 'available',
                }),
              );

              slotTime = new Date(startSlot.getTime() + 60 * 60000);
            }
          }
        }
      }


      // ================= BLOCK TIME =================
      await this.blockRepo.save(
        this.blockRepo.create({
          doctor: { id: doctor.id },
          start_block: toVNDate('2025-12-12 12:00:00'),
          end_block: toVNDate('2025-12-12 13:00:00'),
          reason: 'Nghỉ trưa',
        })
      );


      // ================= RATING =================
      const ratings = [
        { rating: 5, comment: 'Bác sĩ rất tận tâm', patient_id: `P${index}01` },
        { rating: 4, comment: 'Khám kỹ, giải thích rõ', patient_id: `P${index}02` },
      ];

      await this.ratingRepo.save(
        ratings.map((r) =>
          this.ratingRepo.create({
            ...r,
            doctor: { id: doctor.id },
          }),
        ),
      );

      console.log(`✔ Created doctor: ${d.full_name}`);
    }

    console.log('🎉 DONE SEED!');
  }
}
