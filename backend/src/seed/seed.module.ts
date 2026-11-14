import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Domaine } from '../entities/domaine.entity';
import { Competence } from '../entities/competence.entity';
import { Eleve } from '../entities/eleve.entity';
import { SeedService } from './seed.service';

@Module({
    imports: [TypeOrmModule.forFeature([Domaine, Competence, Eleve])],
    providers: [SeedService],
})
export class SeedModule { }
