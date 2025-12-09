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
    Logger,
} from '@nestjs/common';
import { LabTestOrdersService } from '../services/lab-test-order.service';
import { CreateLabTestOrderDto } from '../dto/create-lab-test-order.dto';
import { LabTestOrderStatus } from '../enums/lab-test-order-status.enum';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { LabTestOrder } from '../lab-test-order.entity';

@Controller('api/appointments/lab-test-orders')
@UseInterceptors(ResponseInterceptor)
export class LabTestOrdersController {
    private readonly logger = new Logger(LabTestOrdersController.name);

    constructor(private readonly labTestOrdersService: LabTestOrdersService) { }


    @Post()
    create(@Body() dto: CreateLabTestOrderDto) {
        return this.labTestOrdersService.create(dto);
    }

    @Post('with-payment')
    createWithPayment(@Body() dto: CreateLabTestOrderDto) {
        this.logger.log(`📥 [CONTROLLER] Received request to create lab test order WITH payment`);
        this.logger.log(`📥 [CONTROLLER] DTO:`, JSON.stringify(dto, null, 2));
        return this.labTestOrdersService.createWithPayment(dto);
    }

    /**
     * DEBUG ENDPOINT: Test creating a lab test order with payment
     * POST /api/appointments/lab-test-orders/debug-test
     * 
     * Body: { appointmentId: string, type: LabTestType, labTestId?: string }
     */
    @Post('debug-test')
    async debugTestCreateWithPayment(@Body() dto: CreateLabTestOrderDto) {
        this.logger.warn(`🧪 [DEBUG TEST] Creating lab test order with payment (DEBUG MODE)`);
        this.logger.warn(`🧪 [DEBUG TEST] Input DTO:`, JSON.stringify(dto, null, 2));
        
        try {
            const result = await this.labTestOrdersService.createWithPayment(dto);
            
            this.logger.warn(`🧪 [DEBUG TEST] ✅ Success!`);
            this.logger.warn(`🧪 [DEBUG TEST] Result:`, JSON.stringify({
                id: result.id,
                appointmentId: result.appointmentId,
                type: result.type,
                paymentId: result.paymentId,
                status: result.status,
            }, null, 2));
            
            return {
                success: true,
                message: 'Lab test order created successfully with payment',
                data: result,
                debugInfo: {
                    hasPaymentId: !!result.paymentId,
                    paymentId: result.paymentId || 'NOT CREATED',
                }
            };
        } catch (error) {
            this.logger.error(`🧪 [DEBUG TEST] ❌ Failed!`);
            this.logger.error(`🧪 [DEBUG TEST] Error:`, error.message);
            this.logger.error(`🧪 [DEBUG TEST] Stack:`, error.stack);
            
            throw error;
        }
    }

    @Get()
    findAll() {
        return this.labTestOrdersService.findAll();
    }


    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.labTestOrdersService.findOne(id);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('status') status: LabTestOrderStatus,
    ) {
        return this.labTestOrdersService.updateStatus(id, status);
    }

    @Delete(':id')
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        await this.labTestOrdersService.remove(id);
        return { message: `Successfully deleted lab test order with ID ${id}` };
    }

    @Get('doctor/:doctorId')
    async findAllByDoctor(@Param('doctorId') doctorId: string): Promise<LabTestOrder[]> {
        return this.labTestOrdersService.findAllByDoctor(doctorId);
    }
}
