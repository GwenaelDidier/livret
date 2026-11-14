import { Component, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiService, Eleve } from '../../services/api.service';

@Component({
  selector: 'app-eleve-form',
  standalone: false,
  templateUrl: './eleve-form.component.html',
  styleUrl: './eleve-form.component.scss',
})
export class EleveFormComponent {
  readonly niveaux = ['PS', 'MS', 'GS'];
  nom = '';
  prenom = '';
  classe = '';
  saving = false;
  isEdit = false;

  constructor(
    private dialogRef: MatDialogRef<EleveFormComponent>,
    private api: ApiService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: Eleve | null,
  ) {
    if (data?.id) {
      this.isEdit = true;
      this.nom = data.nom;
      this.prenom = data.prenom;
      this.classe = data.classe ?? '';
    }
  }

  save() {
    if (!this.nom.trim() || !this.prenom.trim()) return;
    this.saving = true;
    const dto = { nom: this.nom.trim(), prenom: this.prenom.trim(), classe: this.classe || undefined };
    const obs = this.isEdit
      ? this.api.updateEleve(this.data!.id, dto)
      : this.api.createEleve(dto);
    obs.subscribe({
      next: (eleve) => { this.saving = false; this.dialogRef.close(eleve); },
      error: () => { this.saving = false; },
    });
  }

  cancel() { this.dialogRef.close(null); }
}
