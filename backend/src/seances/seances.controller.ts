import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { Seance } from '../entities/seance.entity';
import { SeancesService } from './seances.service';

@Controller('seances')
export class SeancesController {
    constructor(private readonly service: SeancesService) { }

    @Get()
    findAll(): Promise<Seance[]> {
        return this.service.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number): Promise<Seance> {
        return this.service.findOne(id);
    }

    @Post()
    create(@Body() dto: Partial<Seance>): Promise<Seance> {
        return this.service.create(dto);
    }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<Seance>): Promise<Seance> {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.service.remove(id);
    }
}
