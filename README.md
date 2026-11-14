# Livret d'Évaluation

Application desktop Windows pour enseignants permettant de saisir, valider et exporter des livrets d'évaluation d'élèves.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Desktop | Electron |
| Frontend | Angular 19 + Angular Material |
| Backend/API | NestJS 11 |
| Base de données | SQLite (via better-sqlite3 + TypeORM) |
| PDF | pdfmake (côté serveur NestJS) |

## Architecture

```
livret/
├── backend/          # API NestJS (port 3001)
│   └── src/
│       ├── entities/         # TypeORM entities (Eleve, Domaine, Competence, Evaluation, Commentaire, Seance)
│       ├── eleves/           # Module CRUD élèves
│       ├── domaines/         # Module CRUD domaines
│       ├── competences/      # Module CRUD compétences
│       ├── evaluations/      # Module évaluations + grille
│       ├── commentaires/     # Module commentaires
│       ├── seances/          # Préparation et gestion des séances par compétence
│       ├── pdf/              # Module génération PDF (pdfmake)
│       └── seed/             # Données de démo initiales
├── frontend/         # Application Angular (port 4200 en dev)
│   └── src/app/
│       ├── services/         # ApiService (HTTP client)
│       └── components/
│           ├── grille/           # Grille principale (élèves × compétences)
│           ├── livret/           # Visualisation livret (dialog)
│           ├── commentaire-popup/ # Popup de saisie commentaire
│           └── eleve-form/       # Formulaire ajout élève
├── electron/         # Shell Electron
│   └── main.js       # Processus principal
└── shared/           # Types TypeScript partagés
```

## Démarrage en développement

### Prérequis
- Node.js ≥ 18
- npm ≥ 9

### 1. Démarrer le backend
```bash
cd backend
npm run start:dev
# API sur http://localhost:3001/api
```

### 2. Démarrer le frontend
```bash
cd frontend
npm start
# App sur http://localhost:4200
```

### 3. (Optionnel) Démarrer Electron en dev
```bash
cd electron
npm start
# Charge http://localhost:4200 automatiquement
```

### Tout en une commande (racine)
```bash
npm run dev
```

## Modèle de données

### Statuts d'évaluation
| Valeur | Libellé | Icône |
|--------|---------|-------|
| `non_evalue` | Non évalué | — |
| `en_cours` | En cours | ~ |
| `acquis` | Acquis | ✓ |
| `non_acquis` | Non acquis | ✗ |

### Entités
- **Eleve** : id, nom, prenom, classe, ordre
- **Domaine** : id, nom, description, ordre
- **Competence** : id, code, libelle, description, domaineId, et domaineModele pour les compétences issues du modèle d’évaluation
- **Evaluation** : id, eleveId, competenceId, statut, dateModification *(unique par élève+compétence)*
- **Commentaire** : id, eleveId, competenceId (null = global), texte, dateCreation/Modification
- **Séance** : id, titre, compétence associée, date, durée, objectif, prérequis, matériel, déroulement, différenciation et évaluation

## UX — Grille principale

- **Filtre par classe et niveau** : filtre les élèves et les objectifs de référence affichés par palier PS, MS ou GS ; les compétences du modèle restent évaluables quel que soit le palier
- **Clic sur une cellule** : cycle rapide des statuts non_evalue → acquis → en_cours → non_acquis ; les cellules sont aussi accessibles au clavier
- **Clic droit** sur une cellule : ouvre la popup de commentaire
- **Saisie groupée** : applique un statut à une compétence à évaluer pour une classe ou une sélection d'élèves
- **Bouton livret** (icône 📖) sur la ligne élève : ouvre la prévisualisation
- **Bouton commentaire** (icône 💬) sur la ligne élève : ouvre le commentaire général
- Les en-têtes de colonnes (compétences) sont en **texte vertical** pour économiser l'espace
- Les domaines regroupent les compétences avec un **en-tête coloré**
- Les compétences à évaluer sont importées depuis `data/modeleSimple.json` au démarrage du backend et regroupées sous les thématiques correspondantes du référentiel
- Les objectifs du référentiel associés à chaque thématique sont consultables dans la grille, par palier ; les compétences sans correspondance explicite sont regroupées séparément
- Les anciennes évaluations des objectifs du référentiel restent en base, mais ne sont pas converties automatiquement en évaluations de compétences : il n'existe pas de correspondance individuelle univoque
- Les anciens domaines de démonstration sont masqués sans supprimer les évaluations qui leur sont rattachées

## PDF

Le PDF est généré côté **serveur NestJS** via `pdfmake` et reprend les compétences à évaluer issues de `data/modeleSimple.json` :

1. L'utilisateur clique "Télécharger PDF" depuis le dialog livret
2. Le frontend appelle `GET /api/pdf/livret/:eleveId?acquisSeulement=true`
3. NestJS charge les données → construit le docDefinition pdfmake → retourne le Buffer
4. Le navigateur/Electron ouvre le fichier

### Paramètres
- `acquisSeulement=true` : n'inclut que les compétences acquises (défaut)
- `acquisSeulement=false` : inclut toutes les compétences évaluées
- `GET /api/pdf/seance/:seanceId` : génère la fiche de préparation de séance au format PDF

## Préparation des séances

La page **Compétences & séances** occupe toute la largeur disponible et présente les domaines dans des onglets. Les compétences sont illustrées par thématique. Chaque compétence peut avoir une ou plusieurs séances associées. La fiche de préparation contient le titre, la date, la durée, l’objectif d’apprentissage, les prérequis, le matériel, le déroulement, la différenciation et les critères d’évaluation. Les séances sont enregistrées dans SQLite et leur fiche peut être téléchargée au format PDF.

La trame reprend les rubriques pédagogiques usuelles ; elle est à adapter aux consignes de l’école ou de l’académie, aucun modèle national unique n’étant imposé.

Les illustrations OpenMoji sont attribuées à OpenMoji contributors et distribuées sous licence [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) ([source](https://openmoji.org/)).

## Build production

```bash
npm run build:all  # Build Angular + NestJS
cd electron
npm run dist       # Package Electron en .exe Windows (NSIS)
```

## Plan MVP → Itérations

| Étape | Description | Statut |
|-------|-------------|--------|
| 1 | Init repo + Electron + Angular | ✅ Fait |
| 2 | NestJS CRUD + SQLite + Seed data | ✅ Fait |
| 3 | Grille principale + validation | ✅ Fait |
| 4 | Popups commentaires | ✅ Fait |
| 5 | Visualisation livret "acquis uniquement" | ✅ Fait |
| 6 | Génération PDF | ✅ Fait |
| 7 | Tests, perf, export/import | 🔜 À faire |
