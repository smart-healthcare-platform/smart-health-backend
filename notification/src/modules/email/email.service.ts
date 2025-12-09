import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendAppointmentConfirmationForPatient(
    to: string,
    data: { patientName: string; doctorName: string; appointmentTime: string },
  ) {
    try {
      await this.mailerService.sendMail({
        to: to,
        subject: '📅 Lịch hẹn khám bệnh đã được xác nhận',
        template: 'appointment-patient',
        context: data,
      });
      this.logger.log(`Appointment confirmation email sent to patient ${to}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to send appointment confirmation email to patient ${to}: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendAppointmentConfirmationForDoctor(
    to: string,
    data: { doctorName: string; patientName: string; appointmentTime: string; conversation: string },
  ) {
    try {
      await this.mailerService.sendMail({
        to: to,
        subject: '📅 Bạn có lịch khám mới',
        template: 'appointment-doctor',
        context: data,
      });
      this.logger.log(`Appointment confirmation email sent to doctor ${to}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to send appointment confirmation email to doctor ${to}: ${error.message}`,
        error.stack,
      );
    }
  }

  async notifyAppointmentConfirmation({
    doctorEmail,
    doctorName,
    patientName,
    patientEmail,
    appointmentTime,
    conversation,
  }: {
    doctorEmail: string;
    doctorName: string;
    patientName: string;
    patientEmail: string;
    appointmentTime: string;
    conversation: string;
  }) {
    await Promise.all([
      this.sendAppointmentConfirmationForPatient(patientEmail, {
        patientName,
        doctorName,
        appointmentTime,
      }),
      this.sendAppointmentConfirmationForDoctor(doctorEmail, {
        doctorName,
        patientName,
        appointmentTime,
        conversation,
      }),
    ]);
  }
}
