import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class NotificationService {
  constructor(private readonly mailerService: MailerService) {}

  async sendAppointmentConfirmationForPatient(
    patientEmail: string,
    patientName: string,
    doctorName: string,
    appointmentTime: string,
  ) {
    return this.mailerService.sendMail({
      to: patientEmail,
      subject: '📅 Lịch hẹn khám bệnh đã được xác nhận',
      template: './appointment-patient',
      context: {
        patientName,
        doctorName,
        appointmentTime,
      },
    });
  }

  async sendAppointmentConfirmationForDoctor(
    doctorEmail: string,
    doctorName: string,
    patientName: string,
    appointmentTime: string,
    conversation: string,
  ) {
    return this.mailerService.sendMail({
      to: doctorEmail,
      subject: '📅 Bạn có lịch khám mới',
      template: './appointment-doctor',
      context: {
        doctorName,
        patientName,
        appointmentTime,
        conversation,
      },
    });
  }

  // Hàm tổng gọi 2 bên
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
      this.sendAppointmentConfirmationForPatient(
        patientEmail,
        patientName,
        doctorName,
        appointmentTime,
      ),
      this.sendAppointmentConfirmationForDoctor(
        doctorEmail,
        doctorName,
        patientName,
        appointmentTime,
        conversation,
      ),
    ]);
  }
}
