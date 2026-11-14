import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    UpdateDateColumn,
    Unique,
} from 'typeorm';
import { Eleve } from './eleve.entity';
import { Competence } from './competence.entity';

export type EvaluationStatus = 'non_evalue' | 'en_cours' | 'acquis' | 'non_acquis';

@Entity('evaluations')
@Unique(['eleveId', 'competenceId'])
export class Evaluation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'varchar',
        default: 'non_evalue',
    })
    statut: EvaluationStatus;

    @Column()
    eleveId: number;

    @Column()
    competenceId: number;

    @ManyToOne(() => Eleve, (e) => e.evaluations)
    @JoinColumn({ name: 'eleveId' })
    eleve: Eleve;

    @ManyToOne(() => Competence, (c) => c.evaluations)
    @JoinColumn({ name: 'competenceId' })
    competence: Competence;

    @UpdateDateColumn()
    dateModification: Date;

    @Column({ type: 'varchar', nullable: true, default: null })
    niveau: string | null;
}
