import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { CalendarService } from './calendar.service';

@Controller('api/calendar')
export class CalendarController {
    constructor(private readonly calendarService: CalendarService) { }

    @Get('events')
    async getEvents(
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('doctorEmail') doctorEmail?: string,
    ) {
        return await this.calendarService.getEvents(from, to, doctorEmail);
    }

    // POST /calendar/create
    @Post('create')
    async createEvent(
        @Body()
        body: {
            summary: string;
            start: string;
            end: string;
            doctorEmail: string;
            patientEmail: string;
        },
    ) {
        return await this.calendarService.createEvent(
            body.summary,
            body.start,
            body.end,
            body.doctorEmail,
            body.patientEmail,
        );
    }
}
