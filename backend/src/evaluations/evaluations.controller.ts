import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { EvaluationStatus } from '../entities/evaluation.entity';

@Controller('evaluations')
export class EvaluationsController {
    constructor(private readonly service: EvaluationsService) { }

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Get('grille')
    getGrille() {
        return this.service.getGrilleData();
    }

    @Get('eleve/:eleveId')
    findByEleve(@Param('eleveId', ParseIntPipe) eleveId: number) {
        return this.service.findByEleve(eleveId);
    }

    @Post('upsert')
    upsert(
        @Body() dto: { eleveId: number; competenceId: number; statut: EvaluationStatus; niveau?: string | null },
    ) {
        return this.service.upsert(dto.eleveId, dto.competenceId, dto.statut, dto.niveau);
    }

    @Post('bulk')
    bulkUpsert(
        @Body() items: { eleveId: number; competenceId: number; statut: EvaluationStatus; niveau?: string | null }[],
    ) {
        return this.service.bulkUpsert(items);
    }
}
