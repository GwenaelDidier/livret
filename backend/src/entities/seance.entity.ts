import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Competence } from './competence.entity';

@Entity('seances')
export class Seance {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    titre: string;

    @Column({ type: 'varchar', nullable: true, default: null })
    dateSeance: string | null;

    @Column({ type: 'varchar', nullable: true, default: null })
    duree: string | null;

    @Column({ type: 'text', nullable: true, default: null })
    objectif: string | null;

    @Column({ type: 'text', nullable: true, default: null })
    prerequis: string | null;

    @Column({ type: 'text', nullable: true, default: null })
    materiel: string | null;

    @Column({ type: 'text', nullable: true, default: null })
    deroulement: string | null;

    @Column({ type: 'text', nullable: true, default: null })
    differenciation: string | null;

    @Column({ type: 'text', nullable: true, default: null })
    evaluation: string | null;

    @Column()
    competenceId: number;

    @ManyToOne(() => Competence, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'competenceId' })
    competence: Competence;

    @CreateDateColumn()
    dateCreation: Date;

    @UpdateDateColumn()
    dateModification: Date;
}
