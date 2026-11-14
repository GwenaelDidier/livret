import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Like, Repository } from 'typeorm';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Domaine } from '../entities/domaine.entity';
import { Competence } from '../entities/competence.entity';
import { Eleve } from '../entities/eleve.entity';

type NiveauCycle = 'PS' | 'MS' | 'GS';
type PalierId = 'avant_4_ans' | 'a_partir_4_ans' | 'a_partir_5_ans';

interface ThemeReferentiel {
    id: string;
    nom: string;
    objectifs: Record<PalierId, string[]>;
}

interface DomaineReferentiel {
    id: string;
    nom_officiel: string;
    thematiques: ThemeReferentiel[];
}

interface ReferentielCycle {
    referentiel: { id: string };
    domaines: DomaineReferentiel[];
}

interface ModeleSimpleCompetence {
    nom: string;
    aide?: string;
}

interface ModeleSimpleDomaine {
    domaine: string;
    competences: ModeleSimpleCompetence[];
}

const PALIERS: { id: PalierId; niveau: NiveauCycle; libelle: string }[] = [
    { id: 'avant_4_ans', niveau: 'PS', libelle: 'À aborder avant 4 ans' },
    { id: 'a_partir_4_ans', niveau: 'MS', libelle: 'À partir de 4 ans' },
    { id: 'a_partir_5_ans', niveau: 'GS', libelle: 'À partir de 5 ans' },
];

const ANCIENS_DOMAINES_DEMO = [
    'Langage écrit',
    'Langage oral',
    'Mathématiques',
    'Sport',
    'Les arts',
    'Les sciences',
];

@Injectable()
export class SeedService implements OnApplicationBootstrap {
    private readonly logger = new Logger(SeedService.name);

    constructor(
        @InjectRepository(Domaine) private readonly domaineRepo: Repository<Domaine>,
        @InjectRepository(Eleve) private readonly eleveRepo: Repository<Eleve>,
        private readonly dataSource: DataSource,
    ) { }

    async onApplicationBootstrap() {
        await this.seedDomaines();
        await this.seedCompetencesModele();
        await this.seedEleves();
    }

    private readReferentiel(): ReferentielCycle {
        const fileName = 'referentiel-cycle-1-2026-2027.json';
        const candidates = [
            join(process.cwd(), '..', 'data', fileName),
            join(process.cwd(), 'data', fileName),
        ];
        const filePath = candidates.find(candidate => existsSync(candidate));
        if (!filePath) {
            throw new Error(`Référentiel introuvable. Chemins vérifiés : ${candidates.join(', ')}`);
        }

        const referentiel = JSON.parse(readFileSync(filePath, 'utf8')) as ReferentielCycle;
        if (!referentiel.referentiel?.id || !Array.isArray(referentiel.domaines) || referentiel.domaines.length === 0) {
            throw new Error(`Le fichier ${filePath} ne contient pas de référentiel de cycle 1 valide.`);
        }
        return referentiel;
    }

    private async seedDomaines() {
        const referentiel = this.readReferentiel();
        const refId = referentiel.referentiel.id;
        const firstDomain = referentiel.domaines[0];
        if (await this.domaineRepo.exist({ where: { sourceId: `${refId}:${firstDomain.id}` } })) return;

        this.logger.log(`Import du référentiel ${refId}...`);
        await this.dataSource.transaction(async manager => {
            const domaineRepo = manager.getRepository(Domaine);
            const competenceRepo = manager.getRepository(Competence);
            const existingRoots = await domaineRepo.find({ where: { parentId: IsNull(), isActive: true } });
            for (const root of existingRoots) {
                if (!root.sourceId && ANCIENS_DOMAINES_DEMO.includes(root.nom)) {
                    root.isActive = false;
                    await domaineRepo.save(root);
                }
            }

            for (const [domainIndex, domainData] of referentiel.domaines.entries()) {
                const domaine = await domaineRepo.save(domaineRepo.create({
                    nom: domainData.nom_officiel,
                    ordre: domainIndex + 1,
                    sourceId: `${refId}:${domainData.id}`,
                    isActive: true,
                }));

                for (const [themeIndex, themeData] of domainData.thematiques.entries()) {
                    const sousdomaine = await domaineRepo.save(domaineRepo.create({
                        nom: themeData.nom,
                        ordre: themeIndex + 1,
                        parentId: domaine.id,
                        sourceId: `${refId}:${themeData.id}`,
                        isActive: true,
                    }));

                    for (const palier of PALIERS) {
                        const objectifs = themeData.objectifs?.[palier.id];
                        if (!Array.isArray(objectifs)) {
                            throw new Error(`Les objectifs du thème ${themeData.id} sont incomplets (${palier.id}).`);
                        }
                        for (const [index, objectif] of objectifs.entries()) {
                            const sourceId = `${refId}:${themeData.id}:${palier.id}:${index + 1}`;
                            await competenceRepo.save(competenceRepo.create({
                                code: `${themeData.id}-${palier.niveau}-${index + 1}`,
                                libelle: objectif,
                                description: `${themeData.nom} · ${palier.libelle}`,
                                ordre: index + 1,
                                domaineId: sousdomaine.id,
                                sourceId,
                                niveau: palier.niveau,
                            }));
                        }
                    }
                }
            }
        });
        this.logger.log(`Import du référentiel terminé (${referentiel.domaines.length} domaines).`);
    }

    private readModeleSimple(): ModeleSimpleDomaine[] {
        const fileName = 'modeleSimple.json';
        const candidates = [
            join(process.cwd(), '..', 'data', fileName),
            join(process.cwd(), 'data', fileName),
        ];
        const filePath = candidates.find(candidate => existsSync(candidate));
        if (!filePath) {
            throw new Error(`Modèle de compétences introuvable. Chemins vérifiés : ${candidates.join(', ')}`);
        }

        const modele = JSON.parse(readFileSync(filePath, 'utf8')) as ModeleSimpleDomaine[];
        if (!Array.isArray(modele) || modele.length === 0 || modele.some(domaine =>
            !domaine.domaine || !Array.isArray(domaine.competences))) {
            throw new Error(`Le fichier ${filePath} ne contient pas de modèle de compétences valide.`);
        }
        return modele;
    }

    private async seedCompetencesModele() {
        const referentiel = this.readReferentiel();
        const modele = this.readModeleSimple();
        const refId = referentiel.referentiel.id;

        await this.dataSource.transaction(async manager => {
            const domaineRepo = manager.getRepository(Domaine);
            const competenceRepo = manager.getRepository(Competence);
            const domaines = await domaineRepo.find({ where: { isActive: true } });
            const domainesParSource = new Map(
                domaines.filter(domaine => domaine.sourceId).map(domaine => [domaine.sourceId!, domaine]),
            );
            const competencesExistantes = await competenceRepo.find({
                where: { sourceId: Like('modeleSimple:v1:%') },
            });
            const sourcesExistantes = new Set(competencesExistantes.map(competence => competence.sourceId));
            const racineNonRattacheeSource = 'modeleSimple:v1:non-rattache';

            let racineNonRattachee = domainesParSource.get(racineNonRattacheeSource);
            if (!racineNonRattachee) {
                racineNonRattachee = await domaineRepo.save(domaineRepo.create({
                    nom: 'Compétences du modèle sans objectif associé',
                    ordre: referentiel.domaines.length + 1,
                    sourceId: racineNonRattacheeSource,
                    isActive: true,
                }));
                domainesParSource.set(racineNonRattacheeSource, racineNonRattachee);
            }

            for (const [domaineIndex, domaineModele] of modele.entries()) {
                let section = '';
                for (const [competenceIndex, competenceModele] of domaineModele.competences.entries()) {
                    if (!competenceModele.nom?.trim()) {
                        throw new Error(`Compétence vide dans le domaine ${domaineModele.domaine}.`);
                    }
                    if (competenceModele.nom.startsWith('##')) {
                        section = competenceModele.nom.slice(2).trim();
                        continue;
                    }

                    const sourceId = `modeleSimple:v1:${domaineIndex + 1}:${competenceIndex + 1}`;
                    if (sourcesExistantes.has(sourceId)) continue;

                    const themeId = this.getThemeIdForModeleCompetence(domaineIndex, section, competenceModele.nom);
                    let domaineId: number;
                    if (themeId) {
                        const theme = domainesParSource.get(`${refId}:${themeId}`);
                        if (!theme) {
                            throw new Error(`La thématique ${themeId} du modèle ne figure pas dans le référentiel ${refId}.`);
                        }
                        domaineId = theme.id;
                    } else {
                        const sousDomaineSource = `${racineNonRattacheeSource}:${domaineIndex + 1}`;
                        let sousDomaine = domainesParSource.get(sousDomaineSource);
                        if (!sousDomaine) {
                            sousDomaine = await domaineRepo.save(domaineRepo.create({
                                nom: domaineModele.domaine,
                                ordre: domaineIndex + 1,
                                parentId: racineNonRattachee.id,
                                sourceId: sousDomaineSource,
                                isActive: true,
                            }));
                            domainesParSource.set(sousDomaineSource, sousDomaine);
                        }
                        domaineId = sousDomaine.id;
                    }

                    await competenceRepo.save(competenceRepo.create({
                        code: `MS-${String(domaineIndex + 1).padStart(2, '0')}-${String(competenceIndex + 1).padStart(3, '0')}`,
                        libelle: competenceModele.nom,
                        description: competenceModele.aide,
                        domaineModele: domaineModele.domaine,
                        ordre: competenceIndex + 1,
                        domaineId,
                        sourceId,
                        niveau: null,
                    }));
                    sourcesExistantes.add(sourceId);
                }
            }
        });
    }

    private getThemeIdForModeleCompetence(domainIndex: number, section: string, label: string): string | null {
        const normalize = (value: string) => value.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('fr');
        const group = normalize(section);
        const text = normalize(label);
        const has = (...terms: string[]) => terms.some(term => text.includes(term));

        if (domainIndex === 0) {
            if (group.includes('vocabulaire')) return 'D1-T1';
            if (group.includes('syntaxe')) return 'D1-T2';
            if (group.includes('prononcer')) return 'D1-T3';
        }

        if (domainIndex === 1) {
            if (group.includes('sons') || group.includes('lettres')) {
                return has('lettre', 'epelle') ? 'D1-T6' : 'D1-T3';
            }
            if (group.includes('comprendre les ecrits')) {
                return has('histoire connue', 'personnages', 'actions', 'emotions') ? 'D1-T5' : 'D1-T4';
            }
            if (group.includes('apprendre a ecrire')) {
                return has('prenom', 'mots simples') ? 'D1-T7' : 'D1-T8';
            }
            if (group.includes('premiers ecrits')) return 'D1-T7';
        }

        if (domainIndex === 2) {
            if (group.includes('comprendre les nombres')) return has('position') ? 'D2-T2' : 'D2-T1';
            if (group.includes('comparer') || group.includes('mesurer')) return 'D2-T5';
            if (group.includes('formes') || group.includes('motifs')) return has('motif') ? 'D2-T6' : 'D2-T4';
            if (group.includes('problemes')) return 'D2-T3';
        }

        if (domainIndex === 3) {
            if (group.includes('temps')) return 'D5-T1';
            if (group.includes('espace')) return 'D5-T3';
            if (group.includes('vivant')) {
                if (has('animal', 'plante', 'besoins', 'hygiene')) return 'D6-T1';
                if (has('materiau', 'matiere', 'transforme')) return 'D6-T2';
                if (has('outil', 'objet', 'danger')) return 'D6-T3';
            }
        }

        if (domainIndex === 4) {
            if (group.includes('arts plastiques')) {
                if (has('chante', 'voix')) return 'D4-T3';
                if (has('instrument', 'sons')) return 'D4-T4';
                if (has('entends', 'ecoute')) return 'D4-T5';
                return 'D4-T1';
            }
            if (group.includes('corps et mouvement')) {
                if (has('coopere')) return 'D3-T4';
                if (has('joue avec les autres')) return 'D3-T3';
                if (has('emotions')) return 'D3-T3';
                if (has('deplacements', 'environnement', 'regles')) return 'D3-T1';
                return 'D3-T3';
            }
        }

        return null;
    }

    private async seedEleves() {
        if (await this.eleveRepo.count() > 0) return;

        this.logger.log('Seeding élèves...');
        const elevesData = [
            { nom: 'Dupont', prenom: 'Alice', classe: 'CM2-A', ordre: 1 },
            { nom: 'Martin', prenom: 'Bob', classe: 'CM2-A', ordre: 2 },
            { nom: 'Leroy', prenom: 'Clara', classe: 'CM2-A', ordre: 3 },
            { nom: 'Moreau', prenom: 'David', classe: 'CM2-A', ordre: 4 },
            { nom: 'Simon', prenom: 'Emma', classe: 'CM2-A', ordre: 5 },
        ];
        await this.eleveRepo.save(this.eleveRepo.create(elevesData));
    }
}
