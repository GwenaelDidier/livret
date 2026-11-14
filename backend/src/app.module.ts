import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';

import { Eleve } from './entities/eleve.entity';
import { Domaine } from './entities/domaine.entity';
import { Competence } from './entities/competence.entity';
import { Evaluation } from './entities/evaluation.entity';
import { Commentaire } from './entities/commentaire.entity';
import { Seance } from './entities/seance.entity';

import { ElevesModule } from './eleves/eleves.module';
import { DomainesModule } from './domaines/domaines.module';
import { CompetencesModule } from './competences/competences.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { CommentairesModule } from './commentaires/commentaires.module';
import { PdfModule } from './pdf/pdf.module';
import { SeedModule } from './seed/seed.module';
import { SeancesModule } from './seances/seances.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: join(process.cwd(), 'data', 'livret.sqlite'),
      entities: [Eleve, Domaine, Competence, Evaluation, Commentaire, Seance],
      synchronize: true,
      autoLoadEntities: true,
    }),
    ElevesModule,
    DomainesModule,
    CompetencesModule,
    EvaluationsModule,
    CommentairesModule,
    PdfModule,
    SeedModule,
    SeancesModule,
  ],
})
export class AppModule { }
