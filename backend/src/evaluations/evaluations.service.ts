import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evaluation, EvaluationStatus } from '../entities/evaluation.entity';

@Injectable()
export class EvaluationsService {
    constructor(
        @InjectRepository(Evaluation)
        private readonly repo: Repository<Evaluation>,
    ) { }

    findByEleve(eleveId: number): Promise<Evaluation[]> {
        return this.repo.find({ where: { eleveId }, relations: ['competence'] });
    }

    findAll(): Promise<Evaluation[]> {
        return this.repo.find({ relations: ['eleve', 'competence'] });
    }

    async upsert(eleveId: number, competenceId: number, statut: EvaluationStatus, niveau?: string | null): Promise<Evaluation> {
        let evaluation = await this.repo.findOne({ where: { eleveId, competenceId } });
        if (evaluation) {
            evaluation.statut = statut;
            if (niveau !== undefined) evaluation.niveau = niveau ?? null;
        } else {
            evaluation = this.repo.create({ eleveId, competenceId, statut, niveau: niveau ?? null });
        }
        return this.repo.save(evaluation);
    }

    async bulkUpsert(items: { eleveId: number; competenceId: number; statut: EvaluationStatus; niveau?: string | null }[]): Promise<void> {
        await this.repo.manager.transaction(async (manager) => {
            const repo = manager.getRepository(Evaluation);
            for (const item of items) {
                let evaluation = await repo.findOne({ where: { eleveId: item.eleveId, competenceId: item.competenceId } });
                if (evaluation) {
                    evaluation.statut = item.statut;
                    if (item.niveau !== undefined) evaluation.niveau = item.niveau ?? null;
                } else {
                    evaluation = repo.create({
                        eleveId: item.eleveId,
                        competenceId: item.competenceId,
                        statut: item.statut,
                        niveau: item.niveau ?? null,
                    });
                }
                await repo.save(evaluation);
            }
        });
    }

    getGrilleData(): Promise<Evaluation[]> {
        return this.repo.find({ relations: ['eleve', 'competence', 'competence.domaine'] });
    }
}
