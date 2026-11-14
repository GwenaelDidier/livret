import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Competence } from '../entities/competence.entity';
import { Seance } from '../entities/seance.entity';

@Injectable()
export class SeancesService {
    constructor(
        @InjectRepository(Seance) private readonly seanceRepo: Repository<Seance>,
        @InjectRepository(Competence) private readonly competenceRepo: Repository<Competence>,
    ) { }

    findAll(): Promise<Seance[]> {
        return this.seanceRepo.find({
            relations: ['competence', 'competence.domaine'],
            order: { dateModification: 'DESC', id: 'DESC' },
        });
    }

    async findOne(id: number): Promise<Seance> {
        const seance = await this.seanceRepo.findOne({
            where: { id },
            relations: ['competence', 'competence.domaine'],
        });
        if (!seance) throw new NotFoundException(`Séance ${id} introuvable`);
        return seance;
    }

    async create(dto: Partial<Seance>): Promise<Seance> {
        this.validate(dto);
        const competenceId = dto.competenceId;
        if (competenceId === undefined) throw new BadRequestException('Une compétence doit être associée à la séance.');
        await this.ensureCompetence(competenceId);
        const seance = await this.seanceRepo.save(this.seanceRepo.create(dto));
        return this.findOne(seance.id);
    }

    async update(id: number, dto: Partial<Seance>): Promise<Seance> {
        await this.findOne(id);
        this.validate(dto, false);
        if (dto.competenceId !== undefined) await this.ensureCompetence(dto.competenceId);
        await this.seanceRepo.update(id, dto);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        await this.findOne(id);
        await this.seanceRepo.delete(id);
    }

    private validate(dto: Partial<Seance>, requireCompetence = true): void {
        if ((requireCompetence && !dto.titre?.trim()) || (dto.titre !== undefined && !dto.titre.trim())) {
            throw new BadRequestException('Le titre de la séance est obligatoire.');
        }
        if (requireCompetence && !dto.competenceId) {
            throw new BadRequestException('Une compétence doit être associée à la séance.');
        }
    }

    private async ensureCompetence(competenceId: number): Promise<void> {
        if (!Number.isInteger(competenceId) || !(await this.competenceRepo.exist({ where: { id: competenceId } }))) {
            throw new NotFoundException(`Compétence ${competenceId} introuvable`);
        }
    }
}
