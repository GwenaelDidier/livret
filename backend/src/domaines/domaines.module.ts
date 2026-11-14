import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Domaine } from '../entities/domaine.entity';
import { Competence } from '../entities/competence.entity';
import { DomainesService } from './domaines.service';
import { DomainesController } from './domaines.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Domaine, Competence])],
    providers: [DomainesService],
    controllers: [DomainesController],
    exports: [DomainesService],
})
export class DomainesModule { }
