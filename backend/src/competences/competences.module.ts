import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Competence } from '../entities/competence.entity';
import { CompetencesService } from './competences.service';
import { CompetencesController } from './competences.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Competence])],
    providers: [CompetencesService],
    controllers: [CompetencesController],
    exports: [CompetencesService],
})
export class CompetencesModule { }
