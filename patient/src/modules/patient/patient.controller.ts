import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Patient } from './patient.entity';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

@Controller('api/patients')
@UseInterceptors(ResponseInterceptor)
export class PatientController {
  constructor(private readonly patientService: PatientService) { }

  @Post()
  async create(@Body() dto: CreatePatientDto): Promise<Patient> {
    return this.patientService.create(dto);
  }

  @Get()
  async findAll(): Promise<Patient[]> {
    return this.patientService.findAll();
  }
  @Get('by-user/:userId')
  async getByUserId(@Param('userId') userId: string): Promise<Patient> {
    return this.patientService.findByUserId(userId);
  }
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Patient> {
    return this.patientService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
  ): Promise<Patient> {
    return this.patientService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.patientService.remove(id);
  }
}
