import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Patch,
    Delete,
    ParseUUIDPipe,
    UseInterceptors,
  } from '@nestjs/common';
  import { LabTestsService } from './lab-tests.service';
  import { CreateLabTestDto } from './dto/create-lab-test.dto';
  import { UpdateLabTestDto } from './dto/update-lab-test.dto';
  import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
  
  @Controller('api/appointments/lab-tests')
  @UseInterceptors(ResponseInterceptor)
  export class LabTestsController {
    constructor(private readonly labTestsService: LabTestsService) {}
  
    @Post()
    create(@Body() createLabTestDto: CreateLabTestDto) {
      return this.labTestsService.create(createLabTestDto);
    }
  
    @Get()
    findAll() {
      return this.labTestsService.findAll();
    }
  
    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
      return this.labTestsService.findOne(id);
    }
  
    @Patch(':id')
    update(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() updateLabTestDto: UpdateLabTestDto,
    ) {
      return this.labTestsService.update(id, updateLabTestDto);
    }
  
    @Delete(':id')
    async remove(@Param('id', ParseUUIDPipe) id: string) {
      await this.labTestsService.remove(id);
      return { message: `Successfully deleted lab test with ID ${id}` };
    }
  }
  