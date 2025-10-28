import { Body, Controller, Post, Get, Param, UseInterceptors } from '@nestjs/common';
import { FollowUpSuggestionService } from './follow-up-suggestion.service';
import { CreateFollowUpSuggestionDto } from './dto/create-follow-up-suggestion.dto';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

@Controller('api/appointments/follow-up-suggestions')
@UseInterceptors(ResponseInterceptor)
export class FollowUpSuggestionController {
    constructor(private readonly service: FollowUpSuggestionService) { }

    @Post()
    async create(@Body() body: CreateFollowUpSuggestionDto) {
        return this.service.create(body);
    }

    @Get('patient/:patientId')
    async getByPatient(@Param('patientId') patientId: string) {
        return this.service.findAllByPatient(patientId);
    }

    @Get('patient/:patientId/pending')
    async getPendingByPatient(@Param('patientId') patientId: string) {
        return this.service.findPendingByPatient(patientId);
    }
}
