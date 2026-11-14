# Roadmap — Livret d'évaluation

## Légende
- ✅ Implémenté
- 🔄 En cours / partiel
- ❌ Non implémenté
- 💡 Idée / à planifier

---

## Architecture générale

| Composant | Statut | Notes |
|-----------|--------|-------|
| Backend NestJS | ✅ | Port 3001, SQLite via TypeORM |
| Frontend Angular | ✅ | Angular Material, port 4200 |
| Electron (desktop) | ✅ | Enveloppe l'app web |
| Monorepo avec `concurrently` | ✅ | `npm run dev` à la racine |

---

## Modèle de données

| Entité | Statut | Notes |
|--------|--------|-------|
| Élève (nom, prénom, classe, ordre) | ✅ | |
| Domaine (nom, ordre) | ✅ | |
| Sous-domaine (parentId auto-référence) | ✅ | Un domaine peut contenir des sous-domaines |
| Compétence (code, libelle, domaineId) | ✅ | Rattachée à un domaine ou sous-domaine |
| Évaluation (eleveId, competenceId, statut) | ✅ | Statuts : non_evalué / en_cours / acquis / non_acquis |
| Commentaire (eleveId, competenceId?, texte) | ✅ | Commentaire par compétence ou global |

---

## Données initiales (seed)

| Domaine | Sous-domaines | Statut |
|---------|--------------|--------|
| Langage écrit | Lecture/Compréhension, Production d'écrits | ✅ |
| Langage oral | Écoute et compréhension, Expression orale | ✅ |
| Mathématiques | Nombres et calcul, Géométrie, Grandeurs et mesures | ✅ |
| Sport | _(plat, pas de sous-domaines)_ | ✅ |
| Les arts | _(plat, pas de sous-domaines)_ | ✅ |
| Les sciences | _(plat, pas de sous-domaines)_ | ✅ |
| Élèves de démonstration (5 élèves CM2-A) | | ✅ |

> Pour personnaliser les domaines/compétences : modifier `backend/src/seed/seed.service.ts` et supprimer `backend/data/livret.sqlite`.

---

## Interface utilisateur

### Navigation
| Fonctionnalité | Statut | Notes |
|---------------|--------|-------|
| Menu latéral gauche | ✅ | Accueil, Grille, Élèves, Livrets |
| Page Accueil | ✅ | Raccourcis vers les sections |
| Routing Angular | ✅ | `/accueil`, `/grille`, `/eleves`, `/livrets` |

### Page Grille d'évaluation
| Fonctionnalité | Statut | Notes |
|---------------|--------|-------|
| Une grille par domaine | ✅ | |
| Navigation par **onglets** (un onglet par domaine) | ✅ | MatTabGroup avec point coloré par domaine |
| Support des sous-domaines | ✅ | Titre intermédiaire avec `›` |
| En-têtes de compétences en texte vertical | ✅ | |
| Colonne Élève sticky (scroll horizontal) | ✅ | |
| Clic cellule → cycle de statuts | ✅ | non_évalué → **acquis** → en_cours → non_acquis (acquis en 1 clic) |
| Clic droit → popup commentaire | ✅ | |
| Indicateur visuel de commentaire (point orange) | ✅ | |
| Légende des statuts | ✅ | |
| Ajouter un élève depuis la grille | ✅ | |
| Ouvrir le livret d'un élève | ✅ | |
| Filtre par classe | ❌ | À implémenter |
| Réorganiser l'ordre des élèves (drag & drop) | ❌ | |
| Modifier / supprimer un élève depuis la grille | ❌ | |

### Page Élèves
| Fonctionnalité | Statut | Notes |
|---------------|--------|-------|
| Lister tous les élèves | ✅ | |
| Ajouter un élève | ✅ | |
| Supprimer un élève | ✅ | |
| Modifier un élève (nom, prénom, classe) | ❌ | |
| Importer une liste d'élèves (CSV) | ❌ | |
| Grouper par classe | ❌ | |

### Page Livrets
| Fonctionnalité | Statut | Notes |
|---------------|--------|-------|
| Page dédiée `/livrets` | ✅ | Cartes élèves avec taux d'avancement |
| Barre de progression segmentée | ✅ | Vert/Orange/Rouge/Gris par statut |
| Pastilles de comptage par statut | ✅ | |
| Clic carte → ouvre le livret individuel | ✅ | |
| Export PDF de la classe entière | ✅ | Bouton sur la page Livrets |

### Livret individuel (popup)
| Fonctionnalité | Statut | Notes |
|---------------|--------|-------|
| Afficher les compétences acquises | ✅ | |
| Toggle "acquis seulement / tout afficher" | ✅ | |
| Graphe radar par domaine | ✅ | SVG pur, sans dépendance externe |
| Statistiques globales (% acquis, par domaine) | ✅ | |
| Dialog élargi (min 1100px) | ✅ | |
| Générer le livret en PDF | ✅ | Téléchargement blob via HttpClient |
| Commentaires par compétence dans le PDF | 🔄 | Commentaires sauvegardés mais intégration PDF à vérifier |
| Commentaire général dans le PDF | 🔄 | |
| Page de garde personnalisable (nom de l'école, année) | ❌ | |

---

## Administration des contenus

| Fonctionnalité | Statut | Notes |
|---------------|--------|-------|
| CRUD Domaines via API REST | ✅ | Endpoints `/api/domaines` |
| CRUD Compétences via API REST | ✅ | Endpoints `/api/competences` |
| Interface d'admin domaines/compétences | ❌ | Actuellement géré uniquement via seed |
| Réordonner domaines / compétences | ❌ | Le champ `ordre` existe mais pas d'UI |
| Ajouter/modifier/supprimer sous-domaines | ❌ | Support en base, pas d'UI |

---

## Export / Impression

| Fonctionnalité | Statut | Notes |
|---------------|--------|-------|
| PDF individuel par élève | ✅ | Téléchargement blob, support sous-domaines |
| Export PDF de toute la classe | ✅ | Endpoint `/api/pdf/classe`, un livret par élève |
| Export CSV des évaluations | ❌ | |
| Impression de la grille complète | ❌ | |

---

## Technique / DevOps

| Fonctionnalité | Statut | Notes |
|---------------|--------|-------|
| Base de données SQLite locale | ✅ | Fichier `backend/data/livret.sqlite` |
| Synchronisation auto du schéma (TypeORM) | ✅ | `synchronize: true` en dev |
| Hot reload backend (`nest start --watch`) | ✅ | |
| Hot reload frontend (Angular dev server) | ✅ | |
| Build Electron (packaging desktop) | ✅ | `npm run dist` |
| Variables d'environnement (.env) | 🔄 | ConfigModule chargé, mais peu de config exposée |
| Tests unitaires backend | ❌ | |
| Tests E2E | ❌ | |
| Migration de base de données (prod) | ❌ | Actuellement `synchronize: true` uniquement |
| Sauvegarde / restauration de la base | ❌ | |

---

## Prochaines priorités suggérées

1. **Interface d'admin des domaines/compétences** — permettre de créer/modifier sans toucher au code
2. **Modifier un élève** — manquant dans la page Élèves
3. **Filtre par classe** dans la grille
4. **Améliorer le PDF** — commentaires globaux, page de garde
5. **Export CSV** des évaluations
6. **Tests** — au moins les services backend critiques
