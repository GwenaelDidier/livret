import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Eleve } from '../entities/eleve.entity';
import { Domaine } from '../entities/domaine.entity';
import { Evaluation } from '../entities/evaluation.entity';
import { Commentaire } from '../entities/commentaire.entity';
import { Seance } from '../entities/seance.entity';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Eleve, Domaine, Evaluation, Commentaire, Seance])],
    providers: [PdfService],
    controllers: [PdfController],
})
export class PdfModule { }
