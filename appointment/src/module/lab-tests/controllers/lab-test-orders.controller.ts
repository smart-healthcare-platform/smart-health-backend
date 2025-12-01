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
import { LabTestOrdersService } from '../services/lab-test-order.service';
import { CreateLabTestOrderDto } from '../dto/create-lab-test-order.dto';
import { LabTestOrderStatus } from '../enums/lab-test-order-status.enum';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { LabTestOrder } from '../lab-test-order.entity';

@Controller('api/appointments/lab-test-orders')
@UseInterceptors(ResponseInterceptor)
export class LabTestOrdersController {
    constructor(private readonly labTestOrdersService: LabTestOrdersService) { }


    @Post()
    create(@Body() dto: CreateLabTestOrderDto) {
        return this.labTestOrdersService.create(dto);
    }

    @Post('with-payment')
    createWithPayment(@Body() dto: CreateLabTestOrderDto) {
        return this.labTestOrdersService.createWithPayment(dto);
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
