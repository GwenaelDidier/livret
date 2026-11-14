import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ApiService,
  Eleve,
  Domaine,
  Competence,
  Evaluation,
  EvaluationStatus,
} from '../../services/api.service';
import { CommentairePopupComponent } from '../commentaire-popup/commentaire-popup.component';
import { LivretComponent } from '../livret/livret.component';
import { EleveFormComponent } from '../eleve-form/eleve-form.component';
import { forkJoin } from 'rxjs';

const STATUS_CYCLE: EvaluationStatus[] = ['non_evalue', 'acquis', 'en_cours', 'non_acquis'];
const STATUS_ICONS: Record<EvaluationStatus, string> = {
  non_evalue: '',
  en_cours: '~',
  acquis: '✓',
  non_acquis: '✗',
};
const STATUS_LABELS: Record<EvaluationStatus, string> = {
  non_evalue: 'Non évalué',
  en_cours: 'En cours',
  acquis: 'Acquis',
  non_acquis: 'Non acquis',
};

interface GrilleSection {
  label: string | null;
  competences: Competence[];
  objectifs: Competence[];
}

@Component({
  selector: 'app-grille',
  standalone: false,
  templateUrl: './grille.component.html',
  styleUrl: './grille.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrilleComponent implements OnInit {
  eleves: Eleve[] = [];
  domaines: Domaine[] = [];
  competences: Competence[] = [];
  evalMap = new Map<string, EvaluationStatus>();
  niveauMap = new Map<string, string | null>();
  commentaireMap = new Map<string, boolean>();
  private domainIndexByCompetenceId = new Map<number, number>();
  loading = true;
  classeFiltre = '';
  niveauFiltre = 'PS';
  rechercheCompetence = '';
  selectedDomainIndex = 0;
  overviewMode = true;

  @ViewChild('dupDialog') dupDialogTpl!: TemplateRef<unknown>;
  @ViewChild('bulkDialog') bulkDialogTpl!: TemplateRef<unknown>;
  dupForm = { libelle: '', code: '' };
  bulkCompetenceId: number | null = null;
  bulkClass = '';
  bulkNiveau = 'PS';
  bulkEleveIds: number[] = [];
  bulkStatus: EvaluationStatus | null = null;
  bulkSaving = false;
  private bulkDialogRef: MatDialogRef<unknown> | null = null;
  private _dupCompetence: Competence | null = null;
  readonly statusIcons = STATUS_ICONS;
  readonly statusLabels = STATUS_LABELS;
  readonly statusCycle = STATUS_CYCLE;

  readonly DOMAIN_PALETTE = [
    { primary: '#1565C0', light: '#E3F2FD' },
    { primary: '#2E7D32', light: '#E8F5E9' },
    { primary: '#E65100', light: '#FBE9E7' },
    { primary: '#AD1457', light: '#FCE4EC' },
    { primary: '#6A1B9A', light: '#F3E5F5' },
    { primary: '#006064', light: '#E0F7FA' },
  ];

  getDomainColor(index: number) {
    return this.DOMAIN_PALETTE[index % this.DOMAIN_PALETTE.length];
  }

  getVisibleCompetences(competences: Competence[]): Competence[] {
    const query = this.normalizeSearch(this.rechercheCompetence.trim());
    return competences.filter(competence => {
      const matchesLevel = this.niveauFiltre === 'all' || !competence.niveau || competence.niveau === this.niveauFiltre;
      const matchesSearch = !query || this.normalizeSearch(`${competence.code} ${competence.libelle} ${competence.description ?? ''} ${competence.domaineModele ?? ''}`).includes(query);
      return matchesLevel && matchesSearch;
    });
  }

  get matchingCompetenceCount(): number {
    return this.getVisibleCompetences(this.competences).length;
  }

  get competencesVisibles(): Competence[] {
    return this.getVisibleCompetences(this.competences);
  }

  getVisibleCompetenceCountForDomaine(domaine: Domaine): number {
    return this.getVisibleCompetences(this.getAllCompsForDomaine(domaine)).length;
  }

  getVisibleObjectives(objectifs: Competence[]): Competence[] {
    return objectifs.filter(objectif =>
      this.niveauFiltre === 'all' || !objectif.niveau || objectif.niveau === this.niveauFiltre,
    );
  }

  get domainesOverview(): { domaine: Domaine; index: number; competences: number; evalues: number; total: number; progression: number }[] {
    return this.domaines.map((domaine, index) => {
      const competences = this.getVisibleCompetences(this.getAllCompsForDomaine(domaine));
      const nombreCompetences = competences.length;
      const eleves = this.visibleEleves.length;
      const total = nombreCompetences * eleves;
      let evalues = 0;
      for (const competence of competences) {
        for (const eleve of this.visibleEleves) {
          if (this.getStatut(eleve.id, competence.id) !== 'non_evalue') evalues++;
        }
      }
      return {
        domaine,
        index,
        competences: nombreCompetences,
        evalues,
        total,
        progression: total ? Math.round((evalues / total) * 100) : 0,
      };
    });
  }

  selectDomaine(index: number) {
    this.selectedDomainIndex = index;
    this.overviewMode = false;
    this.cdr.markForCheck();
  }

  getDomainIndexForCompetence(competenceId: number): number {
    return this.domainIndexByCompetenceId.get(competenceId) ?? 0;
  }

  private normalizeSearch(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
  }

  onClasseFiltreChange(classe: string) {
    this.classeFiltre = classe;
    if (['PS', 'MS', 'GS'].includes(classe)) this.niveauFiltre = classe;
  }

  get classes(): string[] {
    return [...new Set(this.eleves.map(eleve => eleve.classe).filter((classe): classe is string => !!classe))].sort();
  }

  get visibleEleves(): Eleve[] {
    return this.eleves.filter(eleve => {
      if (this.classeFiltre && eleve.classe !== this.classeFiltre) return false;
      return this.niveauFiltre === 'all' || !['PS', 'MS', 'GS'].includes(eleve.classe ?? '') || eleve.classe === this.niveauFiltre;
    });
  }

  get bulkEleves(): Eleve[] {
    return this.eleves.filter(eleve => {
      if (this.bulkClass && eleve.classe !== this.bulkClass) return false;
      return !['PS', 'MS', 'GS'].includes(eleve.classe ?? '') || eleve.classe === this.bulkNiveau;
    });
  }

  get bulkCompetences(): Competence[] {
    return this.competences.filter(competence => !competence.niveau || competence.niveau === this.bulkNiveau);
  }

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loading = true;
    forkJoin({
      eleves: this.api.getEleves(),
      domaines: this.api.getDomaines(),
      evaluations: this.api.getEvaluationsGrille(),
      commentaires: this.api.getCommentairesGrille(),
    }).subscribe(({ eleves, domaines, evaluations, commentaires }) => {
      this.eleves = eleves;
      this.domaines = domaines;
      this.competences = domaines.flatMap(d => this.getAllCompsForDomaine(d));
      this.domainIndexByCompetenceId.clear();
      this.domaines.forEach((domaine, index) => {
        this.getAllCompsForDomaine(domaine).forEach(competence => {
          this.domainIndexByCompetenceId.set(competence.id, index);
        });
      });
      this.evalMap.clear();
      this.niveauMap.clear();
      (evaluations as Evaluation[]).forEach((e) => {
        this.evalMap.set(`${e.eleveId}_${e.competenceId}`, e.statut);
        if (e.niveau) this.niveauMap.set(`${e.eleveId}_${e.competenceId}`, e.niveau);
      });
      this.commentaireMap.clear();
      commentaires.forEach((c) => {
        if (c.competenceId) this.commentaireMap.set(`${c.eleveId}_${c.competenceId}`, true);
      });
      this.loading = false;
      this.cdr.markForCheck();
    }, () => {
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  getStatut(eleveId: number, competenceId: number): EvaluationStatus {
    return this.evalMap.get(`${eleveId}_${competenceId}`) ?? 'non_evalue';
  }

  getNiveau(eleveId: number, competenceId: number): string | null {
    return this.niveauMap.get(`${eleveId}_${competenceId}`) ?? null;
  }

  /** Returns the CSS class to apply to the eval cell (drives background color). */
  getCellClass(eleveId: number, compId: number): string {
    const statut = this.getStatut(eleveId, compId);
    if (statut === 'acquis') {
      const n = this.getNiveau(eleveId, compId);
      return n ? `status-acquis-${n}` : 'status-acquis';
    }
    return `status-${statut}`;
  }

  hasComment(eleveId: number, competenceId: number): boolean {
    return this.commentaireMap.get(`${eleveId}_${competenceId}`) ?? false;
  }

  onCellClick(eleve: Eleve, competence: Competence) {
    const current = this.getStatut(eleve.id, competence.id);
    console.log('Current status:', current);
    const idx = STATUS_CYCLE.indexOf(current);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    const key = `${eleve.id}_${competence.id}`;
    let autoNiveau: string | null = null;
    if (next === 'acquis') {
      // Auto-set the level from the student's current class
      if (eleve.classe && ['PS', 'MS', 'GS'].includes(eleve.classe)) {
        autoNiveau = eleve.classe;
        this.niveauMap.set(key, autoNiveau);
      }
    } else {
      this.niveauMap.delete(key);
    }
    this.setStatut(eleve.id, competence.id, next, next === 'acquis' ? autoNiveau : null);
  }

  onCellRightClick(event: MouseEvent, eleve: Eleve, competence: Competence) {
    event.preventDefault();
    this.openCommentairePopup(eleve, competence);
  }

  setStatut(eleveId: number, competenceId: number, statut: EvaluationStatus, niveau?: string | null) {
    this.evalMap.set(`${eleveId}_${competenceId}`, statut);
    this.cdr.detectChanges();
    this.api.upsertEvaluation(eleveId, competenceId, statut, niveau).subscribe({
      error: () => {
        this.snack.open('Erreur lors de la sauvegarde', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      },
    });
  }

  openCommentairePopup(eleve: Eleve, competence: Competence) {
    const ref = this.dialog.open(CommentairePopupComponent, {
      width: '420px',
      data: { eleve, competence },
    });
    ref.afterClosed().subscribe((saved: boolean) => {
      if (saved) {
        this.commentaireMap.set(`${eleve.id}_${competence.id}`, true);
        this.cdr.markForCheck();
      }
    });
  }

  openCommentaireGlobal(eleve: Eleve) {
    this.dialog.open(CommentairePopupComponent, {
      width: '420px',
      data: { eleve, competence: null },
    });
  }

  openLivret(eleve: Eleve) {
    this.dialog.open(LivretComponent, {
      width: 'min(1400px, 98vw)',
      maxWidth: '98vw',
      maxHeight: '95vh',
      data: { eleve, domaines: this.domaines, evalMap: this.evalMap, niveauMap: this.niveauMap },
    });
  }

  openAddEleve() {
    const ref = this.dialog.open(EleveFormComponent, { width: '400px' });
    ref.afterClosed().subscribe((created) => {
      if (created) this.loadAll();
    });
  }

  openBulkDialog() {
    this.bulkCompetenceId = null;
    this.bulkClass = '';
    this.bulkNiveau = ['PS', 'MS', 'GS'].includes(this.niveauFiltre) ? this.niveauFiltre : 'PS';
    this.bulkEleveIds = this.bulkEleves.map(eleve => eleve.id);
    this.bulkStatus = null;
    this.bulkDialogRef = this.dialog.open(this.bulkDialogTpl, { width: '560px', maxWidth: '95vw' });
    this.bulkDialogRef.afterClosed().subscribe(() => {
      this.bulkDialogRef = null;
      this.bulkSaving = false;
    });
  }

  onBulkClassChange(classe: string) {
    this.bulkClass = classe;
    if (['PS', 'MS', 'GS'].includes(classe)) this.bulkNiveau = classe;
    this.bulkCompetenceId = null;
    this.bulkEleveIds = this.bulkEleves.map(eleve => eleve.id);
  }

  onBulkCompetenceChange() {
    this.bulkEleveIds = this.bulkEleves.map(eleve => eleve.id);
  }

  onBulkNiveauChange() {
    this.bulkCompetenceId = null;
    this.bulkEleveIds = this.bulkEleves.map(eleve => eleve.id);
  }

  applyBulkEvaluation() {
    if (this.bulkSaving || this.bulkCompetenceId === null || !this.bulkStatus || this.bulkEleveIds.length === 0) return;

    const competenceId = this.bulkCompetenceId;
    const statut = this.bulkStatus;
    const items = this.bulkEleveIds.map(eleveId => {
      const eleve = this.eleves.find(item => item.id === eleveId);
      const niveau = statut === 'acquis' && eleve?.classe && ['PS', 'MS', 'GS'].includes(eleve.classe)
        ? eleve.classe
        : null;
      return {
        eleveId,
        competenceId,
        statut,
        niveau,
      };
    });

    this.bulkSaving = true;
    this.api.bulkUpsertEvaluations(items).subscribe({
      next: () => {
        items.forEach(item => {
          const key = `${item.eleveId}_${item.competenceId}`;
          this.evalMap.set(key, item.statut);
          if (item.niveau) this.niveauMap.set(key, item.niveau);
          else this.niveauMap.delete(key);
        });
        this.bulkSaving = false;
        this.cdr.markForCheck();
        this.bulkDialogRef?.close();
        this.snack.open(`${items.length} élève(s) mis à jour`, 'OK', { duration: 3000 });
      },
      error: () => {
        this.bulkSaving = false;
        this.cdr.markForCheck();
        this.snack.open('Erreur lors de l’enregistrement. Vérifiez la grille avant de réessayer.', 'Fermer', { duration: 4000 });
      },
    });
  }

  openDuplicateDialog(comp: Competence) {
    this._dupCompetence = comp;
    this.dupForm = { libelle: comp.libelle + ' (variante)', code: comp.code + '-2' };
    const ref = this.dialog.open(this.dupDialogTpl, { width: '440px' });
    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed && this._dupCompetence) {
        this.api.duplicateCompetence(this._dupCompetence.id, {
          libelle: this.dupForm.libelle,
          code: this.dupForm.code,
        }).subscribe({
          next: () => {
            this.snack.open('Compétence dupliquée', undefined, { duration: 2000 });
            this.loadAll();
          },
          error: () => this.snack.open('Erreur lors de la duplication', 'Fermer', { duration: 3000 }),
        });
      }
    });
  }

  trackByEleve(_: number, e: Eleve) { return e.id; }
  trackByDomaine(_: number, d: Domaine) { return d.id; }
  trackByDomaineOverview(_: number, item: { domaine: Domaine }) { return item.domaine.id; }
  trackByCompetence(_: number, c: Competence) { return c.id; }

  /** Returns sections to display inside a domain block.
   *  If the domain has sub-domains, returns one section per sub-domain.
   *  Otherwise returns a single section with the domain's direct competences. */
  getSections(domaine: Domaine): GrilleSection[] {
    if (domaine.sousdomaines?.length) {
      return domaine.sousdomaines
        .map((sd) => ({
          label: sd.nom,
          competences: (sd.competences ?? []).filter(competence => !!competence.domaineModele),
          objectifs: (sd.competences ?? []).filter(competence => !competence.domaineModele),
        }))
        .filter(section => section.competences.length > 0);
    }
    return [{
      label: null,
      competences: (domaine.competences ?? []).filter(competence => !!competence.domaineModele),
      objectifs: (domaine.competences ?? []).filter(competence => !competence.domaineModele),
    }];
  }

  /** Returns all competences for a domain, traversing sub-domains if present. */
  private getAllCompsForDomaine(d: Domaine): Competence[] {
    if (d.sousdomaines?.length) {
      return d.sousdomaines.flatMap(sd => sd.competences ?? []).filter(competence => !!competence.domaineModele);
    }
    return (d.competences ?? []).filter(competence => !!competence.domaineModele);
  }
}
