import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe, Query, HttpCode } from '@nestjs/common';
import { CompetencesService } from './competences.service';
import { Competence } from '../entities/competence.entity';

@Controller('competences')
export class CompetencesController {
    constructor(private readonly service: CompetencesService) { }

    @Get()
    findAll(@Query('domaineId') domaineId?: string) {
        if (domaineId) return this.service.findByDomaine(+domaineId);
        return this.service.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

    @Post()
    create(@Body() dto: Partial<Competence>) { return this.service.create(dto); }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<Competence>) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }

    @Post(':id/duplicate')
    @HttpCode(201)
    duplicate(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: Partial<Competence>,
    ): Promise<Competence> {
        return this.service.duplicate(id, dto);
    }
}
