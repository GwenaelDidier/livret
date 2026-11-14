import { Component, Inject, OnInit, Optional } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
    ApiService, Competence, Domaine, Eleve, Evaluation, EvaluationStatus,
} from '../../services/api.service';
import { RadarDataPoint } from '../radar-chart/radar-chart.component';
import { take } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

interface LivretData {
  eleve: Eleve;
  domaines: Domaine[];
  evalMap: Map<string, EvaluationStatus>;
  niveauMap: Map<string, string | null>;
}

const STATUS_LABELS: Record<EvaluationStatus, string> = {
  non_evalue: 'Non évalué',
  en_cours: 'En cours',
  acquis: 'Acquis',
  non_acquis: 'Non acquis',
};

@Component({
  selector: 'app-livret',
  standalone: false,
  templateUrl: './livret.component.html',
  styleUrl: './livret.component.scss',
})
export class LivretComponent implements OnInit {
  data: LivretData = {
    eleve: { id: 0, nom: '', prenom: '', ordre: 0 },
    domaines: [],
    evalMap: new Map(),
    niveauMap: new Map(),
  };
  readonly statusLabels = STATUS_LABELS;
  acquisSeulement = false;
  pdfLoading = false;
  pdfUrl = '';
  isDialog = false;
  loading = true;
  loadError = false;
  private eleveIdFromRoute: string | null = null;

  readonly DOMAIN_COLORS = ['#1565C0', '#2E7D32', '#E65100', '#AD1457', '#6A1B9A', '#006064'];
  readonly DOMAIN_LIGHTS = ['#E3F2FD', '#E8F5E9', '#FBE9E7', '#FCE4EC', '#F3E5F5', '#E0F7FA'];

  getDomainColor(i: number) { return this.DOMAIN_COLORS[i % this.DOMAIN_COLORS.length]; }
  getDomainLight(i: number) { return this.DOMAIN_LIGHTS[i % this.DOMAIN_LIGHTS.length]; }

  initials(): string {
    return (this.data.eleve.prenom?.[0] ?? '') + (this.data.eleve.nom?.[0] ?? '');
  }

  getStatut(competenceId: number): EvaluationStatus {
    return this.data.evalMap.get(`${this.data.eleve.id}_${competenceId}`) ?? 'non_evalue';
  }

  getNiveau(competenceId: number): string | null {
    return (this.data.niveauMap ?? new Map()).get(`${this.data.eleve.id}_${competenceId}`) ?? null;
  }

  private shouldShow(competence: Competence): boolean {
    if (!this.isApplicable(competence)) return false;
    if (!this.acquisSeulement) return true;
    return this.getStatut(competence.id) !== 'non_evalue';
  }

  /** Returns all competences for a domain, traversing sub-domains if present. */
  getAllComps(d: Domaine): Competence[] {
    const competences = d.sousdomaines?.length
      ? d.sousdomaines.flatMap(sd => sd.competences ?? [])
      : d.competences ?? [];
    return competences.filter(competence => !!competence.domaineModele && this.isApplicable(competence));
  }

  private isApplicable(competence: Competence): boolean {
    const niveau = this.data.eleve.classe;
    return !['PS', 'MS', 'GS'].includes(niveau ?? '') || !competence.niveau || competence.niveau === niveau;
  }

  get sections() {
    return this.data.domaines
      .map((d, i) => {
        if (d.sousdomaines?.length) {
          const subs = d.sousdomaines
            .map(sd => ({
              sousdomaine: sd,
              competences: (sd.competences ?? []).filter(c => !!c.domaineModele && this.shouldShow(c)),
            }))
            .filter(s => s.competences.length > 0);
          return { domaine: d, index: i, subs, directComps: [] as Competence[], hasContent: subs.length > 0 };
        } else {
          const directComps = (d.competences ?? []).filter(c => !!c.domaineModele && this.shouldShow(c));
          return { domaine: d, index: i, subs: [] as { sousdomaine: Domaine; competences: Competence[] }[], directComps, hasContent: directComps.length > 0 };
        }
      })
      .filter(s => s.hasContent);
  }

  private abbreviate(nom: string): string {
    const parts = nom.split(' ');
    if (parts.length === 1) return nom.substring(0, 11);
    const articles = ['les', 'la', 'le', 'l\''];
    const filtered = articles.includes(parts[0].toLowerCase()) ? parts.slice(1) : parts;
    return filtered[filtered.length - 1].substring(0, 11);
  }

  get radarData(): RadarDataPoint[] {
    return this.data.domaines.map(d => {
      const all = this.getAllComps(d);
      const acquis = all.filter(c => this.getStatut(c.id) === 'acquis').length;
      return {
        label: this.abbreviate(d.nom),
        value: all.length > 0 ? Math.round(acquis / all.length * 100) : 0,
      };
    });
  }

  get globalStats() {
    const all = this.data.domaines.flatMap(d => this.getAllComps(d));
    let acquis = 0, en_cours = 0, non_acquis = 0, non_evalue = 0;
    for (const c of all) {
      const s = this.getStatut(c.id);
      if (s === 'acquis') acquis++;
      else if (s === 'en_cours') en_cours++;
      else if (s === 'non_acquis') non_acquis++;
      else non_evalue++;
    }
    return { total: all.length, acquis, en_cours, non_acquis, non_evalue };
  }

  get niveauPieSlices(): { label: string; color: string; count: number; dasharray: string; dashoffset: string }[] {
    const r = 38;
    const circ = 2 * Math.PI * r;
    const allAcquis = this.acquisByNiveau.reduce((s, n) => s + n.count, 0) + this.acquisSansNiveau;
    if (allAcquis === 0) return [];
    const items = [
      ...this.acquisByNiveau,
      { label: '?', count: this.acquisSansNiveau, color: '#90a4ae' },
    ].filter(n => n.count > 0);
    let cumOffset = 0;
    return items.map(n => {
      const len = (n.count / allAcquis) * circ;
      const slice = { label: n.label, color: n.color, count: n.count, dasharray: `${len} ${circ}`, dashoffset: `${-cumOffset}` };
      cumOffset += len;
      return slice;
    });
  }

  get acquisByNiveau(): { label: string; count: number; color: string }[] {
    const all = this.data.domaines.flatMap(d => this.getAllComps(d));
    const counts: Record<string, number> = { PS: 0, MS: 0, GS: 0 };
    for (const c of all) {
      if (this.getStatut(c.id) === 'acquis') {
        const n = this.getNiveau(c.id);
        if (n && counts[n] !== undefined) counts[n]++;
      }
    }
    return [
      { label: 'PS', count: counts['PS'], color: '#1565C0' },
      { label: 'MS', count: counts['MS'], color: '#E65100' },
      { label: 'GS', count: counts['GS'], color: '#2E7D32' },
    ];
  }

  get acquisSansNiveau(): number {
    const all = this.data.domaines.flatMap(d => this.getAllComps(d));
    return all.filter(c => this.getStatut(c.id) === 'acquis' && !this.getNiveau(c.id)).length;
  }

  get acquisPct(): number {
    const s = this.globalStats;
    return s.total > 0 ? Math.round(s.acquis / s.total * 100) : 0;
  }

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) data: LivretData | null,
    @Optional() private dialogRef: MatDialogRef<LivretComponent>,
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    if (data) this.data = data;
    this.isDialog = !!this.dialogRef;
  }

  ngOnInit() {
    if (!this.isDialog) {
      this.route.paramMap.pipe(take(1)).subscribe(params => {
        this.eleveIdFromRoute = params.get('eleveId');
        if (this.eleveIdFromRoute) {
          this.loadLivretData(this.eleveIdFromRoute);
        }
      });
    } else {
      this.loading = false;
      this.updatePdfUrl();
    }
  }

  private loadLivretData(eleveId: string) {
    const idNum = Number(eleveId);
    forkJoin({
      eleves: this.api.getEleves().pipe(take(1)),
      domaines: this.api.getDomaines().pipe(take(1)),
      evaluations: this.api.getEvaluationsGrille().pipe(take(1)),
    }).subscribe({
      next: ({ eleves, domaines, evaluations }) => {
      const eleve = eleves.find(e => e.id === idNum);
      if (!eleve) {
        this.loading = false;
        this.router.navigate(['/livrets']);
        return;
      }
      const evalMap = new Map<string, EvaluationStatus>();
      const niveauMap = new Map<string, string | null>();
      evaluations.forEach((evaluation: Evaluation) => {
        evalMap.set(`${evaluation.eleveId}_${evaluation.competenceId}`, evaluation.statut);
        if (evaluation.niveau) niveauMap.set(`${evaluation.eleveId}_${evaluation.competenceId}`, evaluation.niveau);
      });
      this.data = { eleve, domaines, evalMap, niveauMap };
      this.loading = false;
      this.updatePdfUrl();
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      },
    });
  }

  updatePdfUrl() {
    this.pdfUrl = this.api.getPdfUrl(this.data.eleve.id, this.acquisSeulement);
  }

  toggleFilter() {
    this.updatePdfUrl();
  }

  downloadPdf() {
    this.pdfLoading = true;
    this.api.downloadPdf(this.data.eleve.id, this.acquisSeulement).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `livret_${this.data.eleve.prenom}_${this.data.eleve.nom}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.pdfLoading = false;
      },
      error: () => { this.pdfLoading = false; },
    });
  }

  close() {
    if (this.isDialog) {
      this.dialogRef.close();
    } else {
      this.router.navigate(['/livrets']);
    }
  }
}
