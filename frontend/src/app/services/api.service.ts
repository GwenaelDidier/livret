import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type EvaluationStatus = 'non_evalue' | 'en_cours' | 'acquis' | 'non_acquis';

export interface Eleve {
    id: number;
    nom: string;
    prenom: string;
    classe?: string;
    ordre: number;
}

export interface Domaine {
    id: number;
    nom: string;
    description?: string;
    ordre: number;
    parentId?: number | null;
    competences?: Competence[];
    sousdomaines?: Domaine[];
}

export interface Competence {
    id: number;
    code: string;
    libelle: string;
    description?: string;
    sourceId?: string | null;
    niveau?: string | null;
    domaineModele?: string | null;
    ordre: number;
    domaineId: number;
    baseCompetenceId?: number;
    domaine?: Domaine;
}

export interface Seance {
    id: number;
    titre: string;
    dateSeance: string | null;
    duree: string | null;
    objectif: string | null;
    prerequis: string | null;
    materiel: string | null;
    deroulement: string | null;
    differenciation: string | null;
    evaluation: string | null;
    competenceId: number;
    competence?: Competence;
}

export interface Evaluation {
    id: number;
    statut: EvaluationStatus;
    eleveId: number;
    competenceId: number;
    niveau: string | null;
    dateModification: string;
}

export interface Commentaire {
    id: number;
    texte: string;
    eleveId: number;
    competenceId?: number;
    dateCreation: string;
    dateModification: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
    private readonly base = 'http://localhost:3001/api';

    constructor(private http: HttpClient) { }

    // Élèves
    getEleves(): Observable<Eleve[]> {
        return this.http.get<Eleve[]>(`${this.base}/eleves`);
    }

    createEleve(dto: Partial<Eleve>): Observable<Eleve> {
        return this.http.post<Eleve>(`${this.base}/eleves`, dto);
    }

    updateEleve(id: number, dto: Partial<Eleve>): Observable<Eleve> {
        return this.http.put<Eleve>(`${this.base}/eleves/${id}`, dto);
    }

    deleteEleve(id: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/eleves/${id}`);
    }

    // Domaines avec compétences
    getDomaines(): Observable<Domaine[]> {
        return this.http.get<Domaine[]>(`${this.base}/domaines`);
    }

    // Compétences
    duplicateCompetence(id: number, dto: Partial<Pick<Competence, 'libelle' | 'code' | 'description'>>): Observable<Competence> {
        return this.http.post<Competence>(`${this.base}/competences/${id}/duplicate`, dto);
    }

    // Séances pédagogiques
    getSeances(): Observable<Seance[]> {
        return this.http.get<Seance[]>(`${this.base}/seances`);
    }

    createSeance(dto: Omit<Seance, 'id' | 'competence'>): Observable<Seance> {
        return this.http.post<Seance>(`${this.base}/seances`, dto);
    }

    updateSeance(id: number, dto: Omit<Seance, 'id' | 'competence'>): Observable<Seance> {
        return this.http.put<Seance>(`${this.base}/seances/${id}`, dto);
    }

    deleteSeance(id: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/seances/${id}`);
    }

    // Évaluations
    getEvaluationsGrille(): Observable<Evaluation[]> {
        return this.http.get<Evaluation[]>(`${this.base}/evaluations/grille`);
    }

    upsertEvaluation(eleveId: number, competenceId: number, statut: EvaluationStatus, niveau?: string | null): Observable<Evaluation> {
        return this.http.post<Evaluation>(`${this.base}/evaluations/upsert`, { eleveId, competenceId, statut, niveau });
    }

    bulkUpsertEvaluations(items: {
        eleveId: number;
        competenceId: number;
        statut: EvaluationStatus;
        niveau?: string | null;
    }[]): Observable<void> {
        return this.http.post<void>(`${this.base}/evaluations/bulk`, items);
    }

    // Commentaires
    getCommentairesByEleve(eleveId: number): Observable<Commentaire[]> {
        return this.http.get<Commentaire[]>(`${this.base}/commentaires/eleve/${eleveId}`);
    }

    getCommentairesGrille(): Observable<Pick<Commentaire, 'eleveId' | 'competenceId'>[]> {
        return this.http.get<Pick<Commentaire, 'eleveId' | 'competenceId'>[]>(`${this.base}/commentaires/grille`);
    }

    upsertCommentaire(eleveId: number, competenceId: number | null, texte: string): Observable<Commentaire> {
        return this.http.post<Commentaire>(`${this.base}/commentaires/upsert`, { eleveId, competenceId, texte });
    }

    // PDF
    getPdfUrl(eleveId: number, acquisSeulement: boolean = true): string {
        return `${this.base}/pdf/livret/${eleveId}?acquisSeulement=${acquisSeulement}`;
    }

    downloadPdf(eleveId: number, acquisSeulement: boolean): Observable<Blob> {
        return this.http.get(
            `${this.base}/pdf/livret/${eleveId}?acquisSeulement=${acquisSeulement}`,
            { responseType: 'blob' },
        );
    }

    downloadClassePdf(acquisSeulement: boolean, classe?: string): Observable<Blob> {
        const params = `acquisSeulement=${acquisSeulement}${classe ? '&classe=' + encodeURIComponent(classe) : ''}`;
        return this.http.get(`${this.base}/pdf/classe?${params}`, { responseType: 'blob' });
    }

    downloadSeancePdf(id: number): Observable<Blob> {
        return this.http.get(`${this.base}/pdf/seance/${id}`, { responseType: 'blob' });
    }
}
