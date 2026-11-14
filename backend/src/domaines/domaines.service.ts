import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Domaine } from '../entities/domaine.entity';

@Injectable()
export class DomainesService {
    constructor(
        @InjectRepository(Domaine)
        private readonly repo: Repository<Domaine>,
    ) { }

    /** Returns only root-level domaines with their sous-domaines and all competences nested. */
    findAll(): Promise<Domaine[]> {
        return this.repo.find({
            where: { parentId: IsNull(), isActive: true },
            relations: ['competences', 'sousdomaines', 'sousdomaines.competences'],
            order: { ordre: 'ASC' },
        });
    }

    async findOne(id: number): Promise<Domaine> {
        const d = await this.repo.findOne({
            where: { id },
            relations: ['competences', 'sousdomaines', 'sousdomaines.competences'],
        });
        if (!d) throw new NotFoundException(`Domaine ${id} introuvable`);
        return d;
    }

    create(dto: Partial<Domaine>): Promise<Domaine> {
        return this.repo.save(this.repo.create(dto));
    }

    async update(id: number, dto: Partial<Domaine>): Promise<Domaine> {
        await this.findOne(id);
        await this.repo.update(id, dto);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        await this.findOne(id);
        await this.repo.delete(id);
    }
}
