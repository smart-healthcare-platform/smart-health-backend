import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Patch,
    Delete,
    UseInterceptors,
    ParseUUIDPipe,
} from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

@Controller('api/appointments/medical-records')
@UseInterceptors(ResponseInterceptor)
export class MedicalRecordsController {
    constructor(
        private readonly medicalRecordsService: MedicalRecordsService,
    ) { }

    @Post()
    create(@Body() createMedicalRecordDto: CreateMedicalRecordDto) {
        return this.medicalRecordsService.create(createMedicalRecordDto);
    }

    @Get()
    findAll() {
        return this.medicalRecordsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.medicalRecordsService.findOne(id);
    }

    @Get('appointment/:appointmentId')
    findByAppointmentId(
        @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    ) {
        return this.medicalRecordsService.findByAppointmentId(appointmentId);
    }

    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateMedicalRecordDto: UpdateMedicalRecordDto,
    ) {
        return this.medicalRecordsService.update(id, updateMedicalRecordDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        // Trả về một object để interceptor có thể wrap
        return this.medicalRecordsService.remove(id).then(() => ({
            message: `Successfully deleted medical record with ID ${id}`,
        }));
    }
}