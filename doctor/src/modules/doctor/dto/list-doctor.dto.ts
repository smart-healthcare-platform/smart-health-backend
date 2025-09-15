export class DoctorListDto {
  id: string;
  full_name: string;
  avatar: string;
  specialty: string;
  experience_years: number;
  bio: string;
  active: boolean;
  degree?: string;        // Ví dụ: "Tiến sĩ"
  display_name?: string;  // Ví dụ: "TS. Đồng Văn Hệ"
}