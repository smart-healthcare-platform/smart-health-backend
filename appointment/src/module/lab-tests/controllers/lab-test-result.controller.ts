import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Patch,
    ParseUUIDPipe,
    UseInterceptors,
} from '@nestjs/common';
import { LabTestResultsService } from '../services/lab-test-result.service';
import { CreateLabTestResultDto } from '../dto/create-lab-test-result.dto';
import { LabResultStatus } from '../enums/lab-test-result-status.enum';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { LabTestResult } from '../lab-test-results.entity';
@Controller('api/appointments/lab-test-results')
@UseInterceptors(ResponseInterceptor)
export class LabTestResultsController {
    constructor(private readonly labTestResultsService: LabTestResultsService) { }

    @Post()
    async create(@Body() dto: CreateLabTestResultDto) {
        return this.labTestResultsService.addLabTestResult(dto.labTestOrderId, dto);
    }

    @Get()
    findAll() {
        return this.labTestResultsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.labTestResultsService.findOne(id);
    }


    @Patch(':id/summary')
    updateSummary(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('summary') summary: string,
    ) {
        return this.labTestResultsService.updateSummary(id, summary);
    }

    @Delete(':id')
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        await this.labTestResultsService.remove(id);
        return { message: `Successfully deleted lab test result with ID ${id}` };
    }

}
