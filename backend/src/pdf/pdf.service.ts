import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Eleve } from '../entities/eleve.entity';
import { Domaine } from '../entities/domaine.entity';
import { Evaluation } from '../entities/evaluation.entity';
import { Commentaire } from '../entities/commentaire.entity';
import { Seance } from '../entities/seance.entity';

// pdfmake is imported as CommonJS
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfMake = require('pdfmake/build/pdfmake');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfFonts = require('pdfmake/build/vfs_fonts');
pdfMake.vfs = pdfFonts.pdfMake?.vfs ?? pdfFonts.vfs;

const STATUS_LABELS: Record<string, string> = {
    acquis: '✓ Acquis',
    en_cours: '~ En cours',
    non_acquis: '✗ Non acquis',
    non_evalue: '— Non évalué',
};

const STATUS_COLORS: Record<string, string> = {
    acquis: '#2e7d32',
    en_cours: '#f57c00',
    non_acquis: '#c62828',
    non_evalue: '#757575',
};

@Injectable()
export class PdfService {
    constructor(
        @InjectRepository(Eleve) private readonly eleveRepo: Repository<Eleve>,
        @InjectRepository(Domaine) private readonly domaineRepo: Repository<Domaine>,
        @InjectRepository(Evaluation) private readonly evalRepo: Repository<Evaluation>,
        @InjectRepository(Commentaire) private readonly commentaireRepo: Repository<Commentaire>,
        @InjectRepository(Seance) private readonly seanceRepo: Repository<Seance>,
    ) { }

    // ── Public methods ───────────────────────────────────────────────────────

    async generateLivretPdf(eleveId: number, acquisseulement = true): Promise<Buffer> {
        const eleve = await this.eleveRepo.findOneOrFail({ where: { id: eleveId } });
        const domaines = await this.loadDomaines();
        const evaluations = await this.evalRepo.find({ where: { eleveId } });
        const commentaires = await this.commentaireRepo.find({ where: { eleveId } });

        const evalMap = new Map<number, string>();
        evaluations.forEach((e) => evalMap.set(e.competenceId, e.statut));

        const content = this.buildEleveContent(
            eleve, domaines, evalMap, this.buildCommentaireMap(commentaires), acquisseulement, true,
        );
        return this.renderPdf(content);
    }

    async generateClassePdf(acquisseulement = false, classe?: string): Promise<Buffer> {
        const whereClause: any = classe ? { classe } : {};
        const eleves = await this.eleveRepo.find({ where: whereClause, order: { nom: 'ASC', prenom: 'ASC' } });
        const domaines = await this.loadDomaines();
        const allEvaluations = await this.evalRepo.find();
        const allCommentaires = await this.commentaireRepo.find();

        const content: any[] = [];
        for (let i = 0; i < eleves.length; i++) {
            const eleve = eleves[i];
            const evalMap = new Map<number, string>();
            allEvaluations.filter(e => e.eleveId === eleve.id).forEach(e => evalMap.set(e.competenceId, e.statut));
            const commentaireMap = this.buildCommentaireMap(allCommentaires.filter(c => c.eleveId === eleve.id));
            content.push(...this.buildEleveContent(eleve, domaines, evalMap, commentaireMap, acquisseulement, i === 0));
        }
        return this.renderPdf(content);
    }

    async generateSeancePdf(seanceId: number): Promise<Buffer> {
        const seance = await this.seanceRepo.findOne({
            where: { id: seanceId },
            relations: ['competence', 'competence.domaine'],
        });
        if (!seance) throw new NotFoundException(`Séance ${seanceId} introuvable`);
        const competence = seance.competence;
        const content: any[] = [
            { text: 'FICHE DE PRÉPARATION DE SÉANCE', style: 'ficheTitle' },
            { text: 'Trame pédagogique à adapter aux consignes de votre école ou académie.', style: 'ficheNote', margin: [0, 0, 0, 18] },
            { text: seance.titre, style: 'titre', margin: [0, 0, 0, 12] },
            {
                table: {
                    widths: ['auto', '*', 'auto', '*'],
                    body: [[
                        { text: 'Domaine', style: 'ficheLabel' },
                        { text: competence.domaine?.nom ?? '—', style: 'ficheValue' },
                        { text: 'Durée', style: 'ficheLabel' },
                        { text: seance.duree || 'À préciser', style: 'ficheValue' },
                    ], [
                        { text: 'Date', style: 'ficheLabel' },
                        { text: seance.dateSeance || 'À préciser', style: 'ficheValue' },
                        { text: 'Compétence', style: 'ficheLabel' },
                        { text: `[${competence.code}] ${competence.libelle}`, style: 'ficheValue' },
                    ]],
                },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 14],
            },
            this.ficheSection('Objectif d’apprentissage', seance.objectif),
            this.ficheSection('Prérequis', seance.prerequis),
            this.ficheSection('Matériel', seance.materiel),
            this.ficheSection('Déroulement de la séance', seance.deroulement),
            this.ficheSection('Différenciation / adaptations', seance.differenciation),
            this.ficheSection('Évaluation / critères de réussite', seance.evaluation),
        ];
        return this.renderPdf(content);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private async loadDomaines(): Promise<Domaine[]> {
        return this.domaineRepo.find({
            where: { parentId: IsNull(), isActive: true },
            relations: ['competences', 'sousdomaines', 'sousdomaines.competences'],
            order: { ordre: 'ASC' },
        });
    }

    private buildCommentaireMap(commentaires: Commentaire[]): Map<number | null, string> {
        const map = new Map<number | null, string>();
        commentaires.forEach((c) => map.set(c.competenceId ?? null, c.texte));
        return map;
    }

    private ficheSection(title: string, value: string | null): any {
        return {
            stack: [
                { text: title, style: 'ficheSectionTitle', margin: [0, 12, 0, 5] },
                { text: value?.trim() || 'À compléter', style: value?.trim() ? 'ficheValue' : 'fichePlaceholder' },
            ],
        };
    }

    private buildEleveContent(
        eleve: Eleve,
        domaines: Domaine[],
        evalMap: Map<number, string>,
        commentaireMap: Map<number | null, string>,
        acquisseulement: boolean,
        isFirst: boolean,
    ): any[] {
        const content: any[] = [];
        if (!isFirst) content.push({ text: '', pageBreak: 'before' });

        content.push({ text: `Livret d'évaluation — ${eleve.prenom} ${eleve.nom.toUpperCase()}`, style: 'titre', margin: [0, 0, 0, 4] });
        content.push(eleve.classe
            ? { text: `Classe : ${eleve.classe}`, style: 'sousTitre', margin: [0, 0, 0, 16] }
            : { text: '', margin: [0, 0, 0, 8] },
        );

        for (const domaine of domaines) {
            const allCompetences = domaine.sousdomaines?.length
                ? domaine.sousdomaines.flatMap(sd => sd.competences ?? [])
                : (domaine.competences ?? []);

            const competencesFiltered = allCompetences
                .filter(c => !!c.domaineModele)
                .sort((a, b) => a.ordre - b.ordre)
                .filter(c => !['PS', 'MS', 'GS'].includes(eleve.classe ?? '') || !c.niveau || c.niveau === eleve.classe)
                .filter(c => acquisseulement ? evalMap.get(c.id) === 'acquis' : true);

            if (competencesFiltered.length === 0) continue;

            content.push({ text: domaine.nom, style: 'domaine', margin: [0, 12, 0, 4] });

            const tableBody: any[][] = [[
                { text: 'Compétence', style: 'tableHeader' },
                { text: 'Statut', style: 'tableHeader' },
                { text: 'Commentaire', style: 'tableHeader' },
            ]];
            for (const c of competencesFiltered) {
                const statut = evalMap.get(c.id) ?? 'non_evalue';
                tableBody.push([
                    { text: `[${c.code}] ${c.libelle}${c.niveau ? ` (${c.niveau})` : ''}`, style: 'cellule' },
                    { text: STATUS_LABELS[statut] ?? statut, style: 'cellule', color: STATUS_COLORS[statut] ?? '#000' },
                    { text: commentaireMap.get(c.id) ?? '', style: 'cellule', italics: true },
                ]);
            }
            content.push({ table: { widths: ['*', 'auto', '*'], body: tableBody }, layout: 'lightHorizontalLines', margin: [0, 0, 0, 8] });
        }

        const commentaireGlobal = commentaireMap.get(null) ?? '';
        if (commentaireGlobal) {
            content.push({ text: 'Commentaire général', style: 'domaine', margin: [0, 12, 0, 4] });
            content.push({ text: commentaireGlobal, style: 'cellule', italics: true, margin: [0, 0, 0, 8] });
        }
        return content;
    }

    private async renderPdf(content: any[]): Promise<Buffer> {
        const docDefinition: any = {
            pageSize: 'A4',
            pageMargins: [40, 60, 40, 60],
            content,
            styles: {
                titre: { fontSize: 18, bold: true, color: '#1a237e' },
                sousTitre: { fontSize: 12, color: '#555' },
                domaine: { fontSize: 13, bold: true, color: '#283593', decoration: 'underline' },
                tableHeader: { fontSize: 10, bold: true, fillColor: '#e8eaf6', color: '#1a237e' },
                cellule: { fontSize: 9 },
                ficheTitle: { fontSize: 11, bold: true, color: '#52627a', characterSpacing: 1.2 },
                ficheNote: { fontSize: 9, color: '#68758a', italics: true },
                ficheSectionTitle: { fontSize: 11, bold: true, color: '#283593' },
                ficheLabel: { fontSize: 9, bold: true, color: '#52627a', fillColor: '#f1f3f8' },
                ficheValue: { fontSize: 10, color: '#263238' },
                fichePlaceholder: { fontSize: 10, color: '#9aa3b2', italics: true },
            },
        };
        const pdfDoc = pdfMake.createPdf(docDefinition);
        const buffer = await pdfDoc.getBuffer();
        if (!buffer?.length) throw new Error('Erreur génération PDF');
        return Buffer.from(buffer);
    }
}
