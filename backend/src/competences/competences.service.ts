import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Competence } from '../entities/competence.entity';

@Injectable()
export class CompetencesService {
    constructor(
        @InjectRepository(Competence)
        private readonly repo: Repository<Competence>,
    ) { }

    findAll(): Promise<Competence[]> {
        return this.repo.createQueryBuilder('competence')
            .innerJoinAndSelect('competence.domaine', 'domaine')
            .leftJoin('domaine.parent', 'parent')
            .where('(domaine.parentId IS NULL AND domaine.isActive = :active) OR parent.isActive = :active', { active: true })
            .orderBy('competence.domaineId', 'ASC')
            .addOrderBy('competence.ordre', 'ASC')
            .getMany();
    }

    findByDomaine(domaineId: number): Promise<Competence[]> {
        return this.repo.createQueryBuilder('competence')
            .innerJoinAndSelect('competence.domaine', 'domaine')
            .leftJoin('domaine.parent', 'parent')
            .where('competence.domaineId = :domaineId', { domaineId })
            .andWhere('(domaine.parentId IS NULL AND domaine.isActive = :active) OR parent.isActive = :active', { active: true })
            .orderBy('competence.ordre', 'ASC')
            .getMany();
    }

    async findOne(id: number): Promise<Competence> {
        const c = await this.repo.findOne({ where: { id }, relations: ['domaine'] });
        if (!c) throw new NotFoundException(`Compétence ${id} introuvable`);
        return c;
    }

    create(dto: Partial<Competence>): Promise<Competence> {
        return this.repo.save(this.repo.create(dto));
    }

    async update(id: number, dto: Partial<Competence>): Promise<Competence> {
        await this.findOne(id);
        await this.repo.update(id, dto);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        await this.findOne(id);
        await this.repo.delete(id);
    }

    async duplicate(id: number, overrides: Partial<Competence>): Promise<Competence> {
        const original = await this.findOne(id);
        if (!original) {
            throw new NotFoundException(`Compétence avec l'ID ${id} non trouvée.`);
        }

        // Décale les compétences suivantes pour faire de la place
        await this.repo
            .createQueryBuilder()
            .update(Competence)
            .set({ ordre: () => 'ordre + 1' })
            .where('domaineId = :domaineId AND ordre > :ordre', {
                domaineId: original.domaineId,
                ordre: original.ordre,
            })
            .execute();

        const newCompetence = this.repo.create({
            ...original,
            id: undefined, // Laisse TypeORM générer un nouvel ID
            sourceId: null,
            libelle: overrides.libelle || original.libelle,
            code: overrides.code || `${original.code}-copy`,
            description: overrides.description ?? original.description,
            ordre: original.ordre + 1, // S'insère juste après l'original
            baseCompetenceId: original.id, // Garde une trace de l'origine
        });

        return this.repo.save(newCompetence);
    }
}
