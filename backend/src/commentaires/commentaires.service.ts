import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commentaire } from '../entities/commentaire.entity';

@Injectable()
export class CommentairesService {
    constructor(
        @InjectRepository(Commentaire)
        private readonly repo: Repository<Commentaire>,
    ) { }

    findByEleve(eleveId: number): Promise<Commentaire[]> {
        return this.repo.find({ where: { eleveId }, order: { dateModification: 'DESC' } });
    }

    findByEleveAndCompetence(eleveId: number, competenceId: number): Promise<Commentaire | null> {
        return this.repo.findOne({ where: { eleveId, competenceId } });
    }

    findGlobalByEleve(eleveId: number): Promise<Commentaire | null> {
        return this.repo.findOne({ where: { eleveId, competenceId: null as any } });
    }

    async upsert(eleveId: number, competenceId: number | null, texte: string): Promise<Commentaire> {
        let commentaire: Commentaire | null = null;
        if (competenceId != null) {
            commentaire = await this.repo.findOne({ where: { eleveId, competenceId } });
        } else {
            commentaire = await this.repo.findOne({ where: { eleveId, competenceId: null as any } });
        }

        if (commentaire) {
            commentaire.texte = texte;
        } else {
            commentaire = this.repo.create({ eleveId, competenceId: competenceId ?? undefined, texte });
        }
        return this.repo.save(commentaire);
    }

    async remove(id: number): Promise<void> {
        await this.repo.delete(id);
    }

    /** All commentaires that have a competenceId (for grille dot indicators) */
    findForGrille(): Promise<Commentaire[]> {
        return this.repo
            .createQueryBuilder('c')
            .select(['c.eleveId', 'c.competenceId'])
            .where('c.competenceId IS NOT NULL')
            .getMany();
    }
}
