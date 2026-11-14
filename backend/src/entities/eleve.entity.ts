import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Evaluation } from './evaluation.entity';
import { Commentaire } from './commentaire.entity';

@Entity('eleves')
export class Eleve {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nom: string;

    @Column()
    prenom: string;

    @Column({ nullable: true })
    classe: string;

    @Column({ default: 0 })
    ordre: number;

    @OneToMany(() => Evaluation, (e) => e.eleve, { cascade: true })
    evaluations: Evaluation[];

    @OneToMany(() => Commentaire, (c) => c.eleve, { cascade: true })
    commentaires: Commentaire[];
}
