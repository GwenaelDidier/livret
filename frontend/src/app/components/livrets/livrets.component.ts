import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
    ApiService, Eleve, Domaine, Evaluation, EvaluationStatus, Competence,
} from '../../services/api.service';
import { LivretComponent } from '../livret/livret.component';

interface EleveStats {
    eleve: Eleve;
    total: number;
    acquis: number;
    enCours: number;
    nonAcquis: number;
    nonEvalue: number;
    acquisPct: number;
    evaluePct: number;
}

@Component({
    selector: 'app-livrets',
    standalone: false,
    templateUrl: './livrets.component.html',
    styleUrl: './livrets.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LivretsComponent implements OnInit {
    loading = true;
    pdfLoading = false;
    stats: EleveStats[] = [];

    private domaines: Domaine[] = [];
    private evalMap = new Map<string, EvaluationStatus>();
    private niveauMap = new Map<string, string | null>();
    private allComps: Competence[] = [];

    constructor(
        private api: ApiService,
        private dialog: MatDialog,
        private router: Router,
        private cdr: ChangeDetectorRef,
    ) { }

    ngOnInit() {
        forkJoin({
            eleves: this.api.getEleves(),
            domaines: this.api.getDomaines(),
            evaluations: this.api.getEvaluationsGrille(),
        }).subscribe({
            next: ({ eleves, domaines, evaluations }) => {
                this.domaines = domaines;
                this.evalMap.clear();
                this.niveauMap.clear();
                (evaluations as Evaluation[]).forEach(e => {
                    this.evalMap.set(`${e.eleveId}_${e.competenceId}`, e.statut);
                    if (e.niveau) this.niveauMap.set(`${e.eleveId}_${e.competenceId}`, e.niveau);
                });

                // Flatten all competences (support sub-domains)
                this.allComps = domaines.flatMap(d =>
                    d.sousdomaines?.length
                        ? d.sousdomaines.flatMap(sd => sd.competences ?? [])
                        : (d.competences ?? [])
                ).filter(competence => !!competence.domaineModele);

                this.stats = (eleves as Eleve[]).map(eleve => this.buildStats(eleve));
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.loading = false;
                this.cdr.markForCheck();
            },
        });
    }

    private buildStats(eleve: Eleve): EleveStats {
        const applicableComps = this.allComps.filter(competence =>
            !['PS', 'MS', 'GS'].includes(eleve.classe ?? '') || !competence.niveau || competence.niveau === eleve.classe
        );
        const total = applicableComps.length;
        let acquis = 0, enCours = 0, nonAcquis = 0;

        for (const c of applicableComps) {
            const s = this.evalMap.get(`${eleve.id}_${c.id}`) ?? 'non_evalue';
            if (s === 'acquis') acquis++;
            else if (s === 'en_cours') enCours++;
            else if (s === 'non_acquis') nonAcquis++;
        }
        const nonEvalue = total - acquis - enCours - nonAcquis;
        const acquisPct = total > 0 ? Math.round(acquis / total * 100) : 0;
        const evaluePct = total > 0 ? Math.round((acquis + enCours + nonAcquis) / total * 100) : 0;

        return { eleve, total, acquis, enCours, nonAcquis, nonEvalue, acquisPct, evaluePct };
    }

    openLivret(s: EleveStats) {
        this.dialog.open(LivretComponent, {
            width: 'min(1400px, 98vw)',
            maxWidth: '98vw',
            maxHeight: '95vh',
            data: { eleve: s.eleve, domaines: this.domaines, evalMap: this.evalMap, niveauMap: this.niveauMap },
        });
    }

    openLivretFullPage(s: EleveStats, event: Event) {
        event.stopPropagation();
        this.router.navigate(['/livret', s.eleve.id]);
    }

    onCardKeydown(s: EleveStats, event: KeyboardEvent) {
        if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        this.openLivret(s);
    }

    trackByEleve(_: number, s: EleveStats) { return s.eleve.id; }

    exportClassePdf() {
        this.pdfLoading = true;
        this.api.downloadClassePdf(false).subscribe({
            next: (blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'livrets_classe.pdf';
                a.click();
                URL.revokeObjectURL(url);
                this.pdfLoading = false;
                this.cdr.markForCheck();
            },
            error: () => { this.pdfLoading = false; this.cdr.markForCheck(); },
        });
    }

    /** Width % for each segment in the stacked bar */
    barWidth(count: number, total: number): string {
        return total > 0
            ? (count / total * 100).toFixed(1) + '%'
            : '0%';
    }
}
