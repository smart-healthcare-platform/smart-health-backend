import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export type PaymentType = 'APPOINTMENT_FEE' | 'LAB_TEST' | 'PRESCRIPTION' | 'OTHER';
export type PaymentMethodType = 'MOMO' | 'VNPAY' | 'CASH' | 'COD';

export interface CreatePaymentRequest {
  paymentType: PaymentType;
  referenceId: string;
  amount: number;
  paymentMethod: PaymentMethodType;
}

export interface PaymentResponse {
  paymentCode: string;
  amount: number;
  status: string;
  paymentUrl?: string;
  paymentType: string;
  referenceId: string;
  createdAt?: string;
}

/**
 * Client for communicating with Billing Service
 * Handles payment creation and management for lab tests and appointments
 */
@Injectable()
export class BillingClient {
  private readonly logger = new Logger(BillingClient.name);
  private readonly billingServiceUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.billingServiceUrl = this.configService.get<string>(
      'BILLING_SERVICE_URL',
      'http://localhost:8083', // Default fallback
    );
  }

  /**
   * Create a payment in Billing Service
   * @param request Payment creation request
   * @returns Payment response with paymentCode
   */
  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      this.logger.log(
        `🌐 [BILLING CLIENT] Sending payment request to: ${this.billingServiceUrl}/api/v1/billings`,
      );
      this.logger.debug(`   Request body:`, JSON.stringify(request, null, 2));

      const response = await firstValueFrom(
        this.http.post(`${this.billingServiceUrl}/api/v1/billings`, request),
      );

      this.logger.log(
        `✅ [BILLING CLIENT] Payment created successfully: ${response.data.paymentCode}`,
      );
      this.logger.debug(`   Response data:`, JSON.stringify(response.data, null, 2));

      return response.data;
    } catch (error) {
      this.logger.error(
        `❌ [BILLING CLIENT] Failed to create payment for ${request.referenceId}`,
      );
      this.logger.error(`   Error message: ${error.message}`);
      this.logger.error(`   Billing service URL: ${this.billingServiceUrl}`);
      if (error.code) {
        this.logger.error(`   Error code: ${error.code}`);
      }
      if (error.response) {
        this.logger.error(`   Response status: ${error.response?.status}`);
        this.logger.error(`   Response data:`, JSON.stringify(error.response?.data, null, 2));
      }
      this.logger.error(`   Stack trace:`, error.stack);

      // Fallback strategy: Return offline payment code if billing service is down
      // This prevents blocking the doctor's workflow
      if (error.code === 'ECONNREFUSED' || error.response?.status >= 500) {
        this.logger.warn(
          'Billing service unavailable, creating offline payment record',
        );

        return {
          paymentCode: `OFFLINE-${Date.now()}`,
          amount: request.amount,
          status: 'PENDING',
          paymentType: request.paymentType,
          referenceId: request.referenceId,
          createdAt: new Date().toISOString(),
        };
      }

      throw error;
    }
  }

  /**
   * Get payment by reference ID (appointmentId, labTestOrderId, etc.)
   * @param referenceId The reference ID to search for
   * @returns Payment response or null if not found
   */
  async getPaymentByReference(
    referenceId: string,
  ): Promise<PaymentResponse | null> {
    try {
      this.logger.log(`Fetching payment for reference: ${referenceId}`);

      const response = await firstValueFrom(
        this.http.get(
          `${this.billingServiceUrl}/api/v1/billings/by-reference/${referenceId}`,
        ),
      );

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        this.logger.debug(`No payment found for reference: ${referenceId}`);
        return null;
      }

      this.logger.error(
        `Error fetching payment for ${referenceId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Update payment status (if needed in future)
   * @param paymentCode Payment code to update
   * @param status New status
   */
  async updatePaymentStatus(
    paymentCode: string,
    status: string,
  ): Promise<void> {
    try {
      this.logger.log(`Updating payment ${paymentCode} to status: ${status}`);

      await firstValueFrom(
        this.http.patch(
          `${this.billingServiceUrl}/api/v1/billings/${paymentCode}/status`,
          { status },
        ),
      );

      this.logger.log(`Payment ${paymentCode} updated successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to update payment status for ${paymentCode}: ${error.message}`,
      );
      throw error;
    }
  }
}
