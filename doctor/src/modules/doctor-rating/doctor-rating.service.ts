import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorRating } from './doctor-rating.entity';
import { CreateDoctorRatingDto } from './dto/create-doctor-rating.dto';
import { UpdateDoctorRatingDto } from './dto/update-doctor-rating.dto';

@Injectable()
export class DoctorRatingService {
  constructor(
    @InjectRepository(DoctorRating)
    private ratingRepo: Repository<DoctorRating>,
  ) {}

  async create(dto: CreateDoctorRatingDto): Promise<DoctorRating> {
    const rating = this.ratingRepo.create(dto);
    return this.ratingRepo.save(rating);
  }

  async findAll(): Promise<DoctorRating[]> {
    return this.ratingRepo.find({ relations: ['doctor'] });
  }

  async findByDoctor(doctor_id: string): Promise<DoctorRating[]> {
    return this.ratingRepo.find({ where: { doctor_id } });
  }

  async findOne(id: string): Promise<DoctorRating> {
    const rating = await this.ratingRepo.findOne({ where: { id }, relations: ['doctor'] });
    if (!rating) throw new NotFoundException(`DoctorRating with id ${id} not found`);
    return rating;
  }

  async update(id: string, dto: UpdateDoctorRatingDto): Promise<DoctorRating> {
    await this.findOne(id);
    await this.ratingRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.ratingRepo.delete(id);
  }

  async averageRating(doctor_id: string): Promise<number> {
    const ratings = await this.findByDoctor(doctor_id);
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return sum / ratings.length;
  }
}
