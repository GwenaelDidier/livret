import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Eleve } from './eleve.entity';
import { Competence } from './competence.entity';

@Entity('commentaires')
export class Commentaire {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('text')
    texte: string;

    @Column()
    eleveId: number;

    @Column({ nullable: true })
    competenceId: number;

    @ManyToOne(() => Eleve, (e) => e.commentaires)
    @JoinColumn({ name: 'eleveId' })
    eleve: Eleve;

    @ManyToOne(() => Competence, (c) => c.commentaires, { nullable: true })
    @JoinColumn({ name: 'competenceId' })
    competence: Competence;

    @CreateDateColumn()
    dateCreation: Date;

    @UpdateDateColumn()
    dateModification: Date;
}
