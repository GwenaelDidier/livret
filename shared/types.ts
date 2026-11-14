// Shared types between frontend and backend

export type EvaluationStatus = 'non_evalue' | 'en_cours' | 'acquis' | 'non_acquis';

export interface IEleve {
    id: number;
    nom: string;
    prenom: string;
    classe?: string;
    ordre: number;
}

export interface IDomaine {
    id: number;
    nom: string;
    description?: string;
    ordre: number;
    competences?: ICompetence[];
}

export interface ICompetence {
    id: number;
    code: string;
    libelle: string;
    description?: string;
    domaineModele?: string | null;
    niveau?: string | null;
    ordre: number;
    domaineId: number;
    domaine?: IDomaine;
}

export interface IEvaluation {
    id: number;
    statut: EvaluationStatus;
    eleveId: number;
    competenceId: number;
    commentaire?: string;
    dateModification: string;
}

export interface ICommentaire {
    id: number;
    texte: string;
    eleveId: number;
    competenceId?: number; // null = commentaire global sur l'élève
    dateCreation: string;
    dateModification: string;
}

export interface IProjet {
    id: number;
    nom: string;
    annee: string;
    description?: string;
    dateCreation: string;
}

export interface IGrilleCell {
    eleveId: number;
    competenceId: number;
    statut: EvaluationStatus;
    commentaire?: string;
}

export interface ILivretEleve {
    eleve: IEleve;
    domaines: {
        domaine: IDomaine;
        competences: {
            competence: ICompetence;
            statut: EvaluationStatus;
            commentaire?: string;
        }[];
    }[];
    commentaireGeneral?: string;
}
