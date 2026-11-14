import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Competence } from '../entities/competence.entity';
import { Seance } from '../entities/seance.entity';
import { SeancesController } from './seances.controller';
import { SeancesService } from './seances.service';

@Module({
    imports: [TypeOrmModule.forFeature([Seance, Competence])],
    providers: [SeancesService],
    controllers: [SeancesController],
})
export class SeancesModule { }
