import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiService, Eleve, Competence } from '../../services/api.service';

interface PopupData {
  eleve: Eleve;
  competence: Competence | null;
}

@Component({
  selector: 'app-commentaire-popup',
  standalone: false,
  templateUrl: './commentaire-popup.component.html',
  styleUrl: './commentaire-popup.component.scss',
})
export class CommentairePopupComponent implements OnInit {
  texte = '';
  saving = false;

  get titre(): string {
    if (!this.data.competence) {
      return `Commentaire général — ${this.data.eleve.prenom} ${this.data.eleve.nom}`;
    }
    return `[${this.data.competence.code}] ${this.data.competence.libelle}`;
  }

  get sousTitre(): string {
    return `Élève : ${this.data.eleve.prenom} ${this.data.eleve.nom}`;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PopupData,
    private dialogRef: MatDialogRef<CommentairePopupComponent>,
    private api: ApiService,
  ) { }

  ngOnInit() {
    this.api.getCommentairesByEleve(this.data.eleve.id).subscribe((commentaires) => {
      const found = commentaires.find(
        (c) => c.competenceId === (this.data.competence?.id ?? undefined),
      );
      if (found) this.texte = found.texte;
    });
  }

  save() {
    this.saving = true;
    const competenceId = this.data.competence?.id ?? null;
    this.api.upsertCommentaire(this.data.eleve.id, competenceId, this.texte).subscribe({
      next: () => {
        this.saving = false;
        this.dialogRef.close(true);
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
