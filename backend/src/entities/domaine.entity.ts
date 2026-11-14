import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Competence } from './competence.entity';

@Entity('domaines')
export class Domaine {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nom: string;

    @Column({ nullable: true })
    description: string;

    @Column({ default: 0 })
    ordre: number;

    @Column({ nullable: true, type: 'int' })
    parentId: number | null;

    @Column({ type: 'varchar', nullable: true, default: null })
    sourceId: string | null;

    @Column({ default: true })
    isActive: boolean;

    @ManyToOne(() => Domaine, (d) => d.sousdomaines, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parentId' })
    parent: Domaine;

    @OneToMany(() => Domaine, (d) => d.parent)
    sousdomaines: Domaine[];

    @OneToMany(() => Competence, (c) => c.domaine, { cascade: true })
    competences: Competence[];
}
