import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Domaine } from './domaine.entity';
import { Evaluation } from './evaluation.entity';
import { Commentaire } from './commentaire.entity';

@Entity('competences')
export class Competence {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    code: string;

    @Column()
    libelle: string;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'varchar', nullable: true, default: null })
    sourceId: string | null;

    @Column({ type: 'varchar', nullable: true, default: null })
    niveau: string | null;

    @Column({ type: 'varchar', nullable: true, default: null })
    domaineModele: string | null;

    @Column({ default: 0 })
    ordre: number;

    @Column()
    domaineId: number;

    @ManyToOne(() => Domaine, (d) => d.competences)
    @JoinColumn({ name: 'domaineId' })
    domaine: Domaine;

    @Column({ type: 'integer', nullable: true, default: null })
    baseCompetenceId?: number;

    @OneToMany(() => Evaluation, (e) => e.competence, { cascade: true })
    evaluations: Evaluation[];

    @OneToMany(() => Commentaire, (c) => c.competence, { cascade: true })
    commentaires: Commentaire[];
}
