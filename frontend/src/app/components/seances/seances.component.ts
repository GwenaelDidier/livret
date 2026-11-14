import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Competence, Domaine, Seance, ApiService } from '../../services/api.service';
import { getCompetenceIllustration } from './illustrations';

type SeanceForm = Omit<Seance, 'id' | 'competence'>;

@Component({
    selector: 'app-seances',
    templateUrl: './seances.component.html',
    styleUrl: './seances.component.scss',
    standalone: false,
})
export class SeancesComponent implements OnInit {
    domaines: Domaine[] = [];
    seances: Seance[] = [];
    loading = true;
    loadError = false;
    saving = false;
    selectedDomainIndex = 0;
    activeCompetenceId: number | null = null;
    editingId: number | null = null;
    form: SeanceForm = this.emptyForm(0);

    constructor(private readonly api: ApiService, private readonly snackBar: MatSnackBar) { }

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading = true;
        this.loadError = false;
        let domainsLoaded = false;
        let sessionsLoaded = false;
        const complete = () => {
            if (domainsLoaded && sessionsLoaded) this.loading = false;
        };
        this.api.getDomaines().subscribe({
            next: (domaines) => {
                this.domaines = domaines;
                domainsLoaded = true;
                complete();
            },
            error: () => {
                this.loadError = true;
                this.loading = false;
                this.snackBar.open('Les domaines et compétences n’ont pas pu être chargés.', 'Fermer', { duration: 5000 });
            },
        });
        this.api.getSeances().subscribe({
            next: (seances) => {
                this.seances = seances;
                sessionsLoaded = true;
                complete();
            },
            error: () => {
                this.loadError = true;
                this.loading = false;
                this.snackBar.open('Les séances n’ont pas pu être chargées.', 'Fermer', { duration: 5000 });
            },
        });
    }

    competenceList(competences: Competence[] | undefined): Competence[] {
        return [...(competences ?? [])].sort((a, b) => a.ordre - b.ordre);
    }

    competenceCount(domaine: Domaine): number {
        return (domaine.competences?.length ?? 0)
            + (domaine.sousdomaines ?? []).reduce((count, sousdomaine) => count + (sousdomaine.competences?.length ?? 0), 0);
    }

    sessionCount(domaine: Domaine): number {
        const competenceIds = new Set([
            ...(domaine.competences ?? []).map((competence) => competence.id),
            ...(domaine.sousdomaines ?? []).flatMap((sousdomaine) => (sousdomaine.competences ?? []).map((competence) => competence.id)),
        ]);
        return this.seances.filter((seance) => competenceIds.has(seance.competenceId)).length;
    }

    illustrationFor(competence: Competence): string | null {
        return getCompetenceIllustration(competence.sourceId, competence.code);
    }

    sessionsFor(competenceId: number): Seance[] {
        return this.seances.filter((seance) => seance.competenceId === competenceId);
    }

    startCreate(competenceId: number): void {
        this.activeCompetenceId = competenceId;
        this.editingId = null;
        this.form = this.emptyForm(competenceId);
    }

    startEdit(seance: Seance): void {
        this.activeCompetenceId = seance.competenceId;
        this.editingId = seance.id;
        this.form = {
            titre: seance.titre,
            dateSeance: seance.dateSeance,
            duree: seance.duree,
            objectif: seance.objectif,
            prerequis: seance.prerequis,
            materiel: seance.materiel,
            deroulement: seance.deroulement,
            differenciation: seance.differenciation,
            evaluation: seance.evaluation,
            competenceId: seance.competenceId,
        };
    }

    cancelEdit(): void {
        this.activeCompetenceId = null;
        this.editingId = null;
    }

    save(): void {
        if (!this.form.titre.trim()) return;
        this.saving = true;
        const request = this.editingId
            ? this.api.updateSeance(this.editingId, this.form)
            : this.api.createSeance(this.form);
        request.subscribe({
            next: () => {
                this.saving = false;
                this.cancelEdit();
                this.load();
                this.snackBar.open('Séance enregistrée.', 'Fermer', { duration: 3000 });
            },
            error: () => {
                this.saving = false;
                this.snackBar.open('La séance n’a pas pu être enregistrée. Réessayez.', 'Fermer', { duration: 5000 });
            },
        });
    }

    delete(seance: Seance): void {
        if (!window.confirm(`Supprimer la séance « ${seance.titre} » ?`)) return;
        this.api.deleteSeance(seance.id).subscribe({
            next: () => {
                this.seances = this.seances.filter((item) => item.id !== seance.id);
                this.snackBar.open('Séance supprimée.', 'Fermer', { duration: 3000 });
            },
            error: () => this.snackBar.open('La séance n’a pas pu être supprimée. Réessayez.', 'Fermer', { duration: 5000 }),
        });
    }

    download(seance: Seance): void {
        this.api.downloadSeancePdf(seance.id).subscribe({
            next: (blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `fiche-seance-${seance.id}.pdf`;
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            },
            error: () => this.snackBar.open('Le PDF n’a pas pu être généré. Réessayez.', 'Fermer', { duration: 5000 }),
        });
    }

    private emptyForm(competenceId: number): SeanceForm {
        return {
            titre: '',
            dateSeance: null,
            duree: null,
            objectif: null,
            prerequis: null,
            materiel: null,
            deroulement: null,
            differenciation: null,
            evaluation: null,
            competenceId,
        };
    }
}
