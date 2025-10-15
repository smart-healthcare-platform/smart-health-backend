// src/vital_signs/vital-signs.controller.ts

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
import { VitalSignsService } from './vital-signs.service';
import { CreateVitalSignDto } from './dto/create-vital-sign.dto';
import { UpdateVitalSignDto } from './dto/update-vital-sign.dto';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

@Controller('api/appointments/vital-signs')
@UseInterceptors(ResponseInterceptor)
export class VitalSignsController {
    constructor(private readonly vitalSignsService: VitalSignsService) { }

    @Post()
    create(@Body() createVitalSignDto: CreateVitalSignDto) {
        return this.vitalSignsService.create(createVitalSignDto);
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.vitalSignsService.findOne(id);
    }

    @Get('record/:medicalRecordId')
    findByMedicalRecordId(
        @Param('medicalRecordId', ParseUUIDPipe) medicalRecordId: string,
    ) {
        return this.vitalSignsService.findByMedicalRecordId(medicalRecordId);
    }

    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateVitalSignDto: UpdateVitalSignDto,
    ) {
        return this.vitalSignsService.update(id, updateVitalSignDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.vitalSignsService.remove(id).then(() => ({
            message: `Successfully deleted vital sign with ID ${id}`,
        }));
    }
}