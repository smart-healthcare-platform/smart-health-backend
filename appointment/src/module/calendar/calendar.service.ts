import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

@Injectable()
export class CalendarService {
    private calendar;
    private auth: JWT;

    constructor() {
        this.auth = new google.auth.JWT({
            email: process.env.GOOGLE_CLIENT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });

        this.calendar = google.calendar({ version: 'v3', auth: this.auth });
    }

    async getEvents(from?: string, to?: string, doctorEmail?: string) {
        const options: any = {
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            singleEvents: true,
            orderBy: 'startTime',
        };

        if (from) options.timeMin = new Date(from).toISOString();
        if (to) options.timeMax = new Date(to).toISOString();

        const res = await this.calendar.events.list(options);

        let items = res.data.items || [];

        if (doctorEmail) {
            items = items.filter((event) =>
                event.attendees?.some((a) => a.email === doctorEmail),
            );
        }

        return items;
    }


    async createEvent(summary: string, start: string, end: string, doctorEmail: string, patientEmail: string) {
        const event = {
            summary,
            start: { dateTime: start, timeZone: 'Asia/Ho_Chi_Minh' },
            end: { dateTime: end, timeZone: 'Asia/Ho_Chi_Minh' },
            attendees: [
                { email: doctorEmail },
                { email: patientEmail },
            ],
        };

        const res = await this.calendar.events.insert({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            requestBody: event,
        });

        return res.data;
    }
}
