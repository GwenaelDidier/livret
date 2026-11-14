import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Eleve } from '../entities/eleve.entity';

@Injectable()
export class ElevesService {
    constructor(
        @InjectRepository(Eleve)
        private readonly repo: Repository<Eleve>,
    ) { }

    findAll(): Promise<Eleve[]> {
        return this.repo.find({ order: { ordre: 'ASC', nom: 'ASC' } });
    }

    async findOne(id: number): Promise<Eleve> {
        const e = await this.repo.findOne({ where: { id } });
        if (!e) throw new NotFoundException(`Élève ${id} introuvable`);
        return e;
    }

    create(dto: Partial<Eleve>): Promise<Eleve> {
        return this.repo.save(this.repo.create(dto));
    }

    async update(id: number, dto: Partial<Eleve>): Promise<Eleve> {
        await this.findOne(id);
        await this.repo.update(id, dto);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        await this.findOne(id);
        await this.repo.delete(id);
    }
}
