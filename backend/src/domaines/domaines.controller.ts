import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { DomainesService } from './domaines.service';
import { Domaine } from '../entities/domaine.entity';

@Controller('domaines')
export class DomainesController {
    constructor(private readonly service: DomainesService) { }

    @Get()
    findAll() { return this.service.findAll(); }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

    @Post()
    create(@Body() dto: Partial<Domaine>) { return this.service.create(dto); }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<Domaine>) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
