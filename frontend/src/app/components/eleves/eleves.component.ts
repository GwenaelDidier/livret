import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { ApiService, Eleve } from '../../services/api.service';
import { EleveFormComponent } from '../eleve-form/eleve-form.component';

const NIVEAUX = ['PS', 'MS', 'GS'] as const;
const NIVEAU_SUIVANT: Record<string, string> = { PS: 'MS', MS: 'GS' };

@Component({
    selector: 'app-eleves',
    standalone: false,
    templateUrl: './eleves.component.html',
    styleUrl: './eleves.component.scss',
})
export class ElevesComponent implements OnInit {
    eleves: Eleve[] = [];
    loading = false;
    promoting: string | null = null;

    readonly niveaux = NIVEAUX;
    readonly niveauSuivant = NIVEAU_SUIVANT;

    constructor(
        private api: ApiService,
        private dialog: MatDialog,
        private snack: MatSnackBar,
    ) { }

    ngOnInit() { this.loadEleves(); }

    loadEleves() {
        this.loading = true;
        this.api.getEleves().subscribe({
            next: (eleves) => { this.eleves = eleves; this.loading = false; },
            error: () => { this.loading = false; },
        });
    }

    elevesForNiveau(niveau: string): Eleve[] {
        return this.eleves.filter(e => e.classe === niveau);
    }

    elevesSansNiveau(): Eleve[] {
        return this.eleves.filter(e => !e.classe || !(NIVEAUX as readonly string[]).includes(e.classe));
    }

    openAddEleve() {
        const ref = this.dialog.open(EleveFormComponent, { width: '420px' });
        ref.afterClosed().subscribe((eleve: Eleve | null) => {
            if (eleve) {
                this.eleves = [...this.eleves, eleve];
                this.snack.open(`${eleve.prenom} ${eleve.nom} ajouté(e)`, 'OK', { duration: 2500 });
            }
        });
    }

    openEditEleve(eleve: Eleve) {
        const ref = this.dialog.open(EleveFormComponent, { width: '420px', data: eleve });
        ref.afterClosed().subscribe((updated: Eleve | null) => {
            if (updated) {
                this.eleves = this.eleves.map(e => e.id === updated.id ? updated : e);
                this.snack.open(`${updated.prenom} ${updated.nom} modifié(e)`, 'OK', { duration: 2500 });
            }
        });
    }

    deleteEleve(eleve: Eleve) {
        if (!confirm(`Supprimer ${eleve.prenom} ${eleve.nom} ?`)) return;
        this.api.deleteEleve(eleve.id).subscribe({
            next: () => {
                this.eleves = this.eleves.filter(e => e.id !== eleve.id);
                this.snack.open(`${eleve.prenom} ${eleve.nom} supprimé(e)`, 'OK', { duration: 2500 });
            },
        });
    }

    promouvoir(niveau: string) {
        const suivant = this.niveauSuivant[niveau];
        if (!suivant) return;
        const toPromote = this.elevesForNiveau(niveau);
        if (toPromote.length === 0) return;
        if (!confirm(`Promouvoir les ${toPromote.length} élève(s) de ${niveau} en ${suivant} ?`)) return;
        this.promoting = niveau;
        forkJoin(toPromote.map(e => this.api.updateEleve(e.id, { classe: suivant }))).subscribe({
            next: (updated) => {
                updated.forEach(u => { this.eleves = this.eleves.map(e => e.id === u.id ? u : e); });
                this.promoting = null;
                this.snack.open(`${toPromote.length} élève(s) promu(s) en ${suivant}`, 'OK', { duration: 3000 });
            },
            error: () => {
                this.promoting = null;
                this.snack.open('Erreur lors de la promotion', 'Fermer', { duration: 3000 });
            },
        });
    }
}
