import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VitalSignsController } from './vital-signs.controller';
import { VitalSignsService } from './vital-signs.service';
import { VitalSign } from './vital-signs.entity';
import { MedicalRecord } from '../medical-records/medical-records.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            VitalSign,
            MedicalRecord,
        ]),
    ],
    controllers: [VitalSignsController],
    providers: [VitalSignsService],
    exports: [VitalSignsService],
})
export class VitalSignsModule { }