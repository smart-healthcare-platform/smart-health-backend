import { Body, Controller, Post, Get, Param, UseInterceptors } from '@nestjs/common';
import { FollowUpSuggestionsService } from './follow_up_suggestions.service';
import { CreateFollowUpSuggestionDto } from './dto/create-follow-up-suggestion.dto';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

@Controller('api/appointments/follow-up-suggestions')
@UseInterceptors(ResponseInterceptor)
export class FollowUpSuggestionsController {
    constructor(private readonly service: FollowUpSuggestionsService) { }

    @Post()
    async create(@Body() body: CreateFollowUpSuggestionDto) {
        return this.service.create(body);
    }

    @Get('patient/:patientId')
    async getByPatient(@Param('patientId') patientId: string) {
        return this.service.findAllByPatient(patientId);
    }
}
