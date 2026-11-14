import { Controller, Get, Post, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { CommentairesService } from './commentaires.service';

@Controller('commentaires')
export class CommentairesController {
    constructor(private readonly service: CommentairesService) { }

    @Get('grille')
    findForGrille() {
        return this.service.findForGrille();
    }

    @Get('eleve/:eleveId')
    findByEleve(@Param('eleveId', ParseIntPipe) eleveId: number) {
        return this.service.findByEleve(eleveId);
    }

    @Post('upsert')
    upsert(@Body() dto: { eleveId: number; competenceId: number | null; texte: string }) {
        return this.service.upsert(dto.eleveId, dto.competenceId, dto.texte);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.service.remove(id);
    }
}
