import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { DoctorRatingService } from './doctor-rating.service';
import { DoctorRating } from './doctor-rating.entity';
import { CreateDoctorRatingDto } from './dto/create-doctor-rating.dto';

@Controller('doctor-ratings')
export class DoctorRatingController {
  constructor(private readonly ratingService: DoctorRatingService) {}

  @Post()
  async create(@Body() dto: CreateDoctorRatingDto): Promise<DoctorRating> {
    return this.ratingService.create(dto);
  }

  @Get()
  async findAll(): Promise<DoctorRating[]> {
    return this.ratingService.findAll();
  }

  @Get('doctor/:doctorId')
  async findByDoctor(@Param('doctorId') doctorId: string): Promise<DoctorRating[]> {
    return this.ratingService.findByDoctor(doctorId);
  }

  @Get('doctor/:doctorId/average')
  async averageRating(@Param('doctorId') doctorId: string): Promise<{ average: number }> {
    const avg = await this.ratingService.averageRating(doctorId);
    return { average: avg };
  }
}
