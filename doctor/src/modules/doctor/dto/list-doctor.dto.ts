import { Gender } from "../enums/doctor-gender.enum";

export class DoctorListDto {
  id: string;
  full_name: string;
  avatar: string;
  gender: Gender
  experience_years: number;
  phone:string
  bio: string;
  active: boolean;
  degree?: string;
  display_name?: string;
}