# NOCTYS HQ — Windows

Application CS2 pour NOCTYS : préparation collective, entraînement individuel, tableaux tactiques, statistiques FACEIT et bibliothèque commune de démos. Interface française noire et violette.

## Installation

Lancer `outputs/windows/noctysstartbook.exe`, puis ouvrir **NOCTYS HQ** depuis le raccourci. Les joueurs n’ont besoin ni de Node.js ni d’un navigateur ou serveur à démarrer. Electron embarque l’interface et la sert sur une adresse 127.0.0.1 aléatoire accessible uniquement sur le PC. Internet est requis pour les comptes et données communes. Voir [installation](INSTALLATION.md), [utilisation](UTILISATION.md), [administration Supabase](ADMINISTRATION-SUPABASE.md) et [stockage des grosses démos](STOCKAGE-DEMOS.md).

L’installateur est non signé : aucun certificat éditeur n’a été fourni. Les mises à jour automatiques ne sont pas configurées. Les exécutables et fichiers personnels sont exclus des commits Git ; le workflow de Release publie l’installateur en asset GitHub après un tag `v*`. Voir [publication GitHub](PUBLICATION-GITHUB.md).

## Activation Supabase

Projet : https://adrleyvcufedeologxnx.supabase.co. La clé publishable est publique par conception ; Supabase Auth et RLS protègent les données.

**Projet NOCTYS existant : les migrations 001 et 002 sont déjà appliquées, selon la confirmation de l’administrateur.** Ne pas les réexécuter. Pour un projet vierge seulement, exécuter 001 puis 002. La migration 002 ajoute les tableaux et conserve les fichiers privés.

Déployer aussi la fonction Edge `username-login` avec `verify_jwt=false` (voir `supabase/config.toml`). Les secrets de service restent dans Supabase. La connexion Windows appelle cette fonction depuis le processus principal. L’ancien aperçu web passe par `/api/login`.

Les comptes confirment leur email puis le staff valide leur rôle dans **Gérer les membres**, via `public.approve_member`. Le premier coach actif existe déjà sur le projet NOCTYS. Choisir coach à l’inscription ne donne pas de privilèges. Le schéma accepte les neuf membres sans nouvelle migration ; pour envoyer leurs confirmations, configurer un SMTP personnalisé dans Supabase.

## Serveur commun des démos

**Macro → Demo analyzer** : le coach ou l’analyste choisit un titre, une map et un fichier `.dem`. Les fichiers sont conservés dans le bucket privé `team-files` ; les fiches sont des enregistrements `demo` de portée `team`. Tous les membres actifs peuvent consulter et télécharger les démos via une URL signée temporaire. Le staff ajoute les notes de review.

Supabase existant sert de serveur commun, sans PC d’équipe toujours allumé. Transfert TUS par blocs de 6 Mio, progression, tentatives automatiques et pause/reprise dans la fenêtre ouverte. Le transfert continue pendant le changement d’onglet. Fermer l’application interrompt le transfert ; la reprise après fermeture n’est pas implémentée. Si le fichier est transféré mais la fiche échoue, un bouton permet de réessayer sa publication.

Limite applicative : 500 Mio. La limite globale du projet prime ; sur le plan Supabase Free, elle ne peut pas dépasser 50 Mo par fichier selon la [documentation Supabase](https://supabase.com/docs/guides/storage/uploads/file-limits). Aucune offre payante n’est activée automatiquement. Prévoir une sauvegarde séparée des objets Storage, en plus de la base de données.

## Pool et Tactical board

Pool demandé par NOCTYS : **Dust2, Mirage, Anubis, Cache, Ancient, Nuke, Inferno**. Centralisé dans `lib/domain/model.ts`. Les anciennes valeurs Dust II sont normalisées à la lecture ; les archives des maps sorties du pool sont conservées.

**Macro → Tactical board** : fonds radar embarqués, niveau inférieur de Nuke, joueurs, flèches de déplacement, dessin libre, smoke/flash/molotov/HE, texte, couleurs et timing 2:15 → 0:05. Déplacement et effacement des objets, annuler/rétablir, zoom, sauvegarde collective, exports JSON et image SVG autonome avec radar. Les joueurs consultent ; coach et analyste éditent. La dernière sauvegarde reçue remplace la précédente : pas de fusion de coédition simultanée.

Usages inspirés de [CSGO Board](https://csgoboard.com/), sans dépendance à son code ou son service. Radars appartenant à Valve Corporation, fournis par [cs2-map-icons](https://github.com/MurkyYT/cs2-map-icons), récupérés le 16 septembre 2026. Voir `public/radars/NOTICE.md`.

## FACEIT

Au premier lancement, la fenêtre **Connecter FACEIT** propose la clé API. Elle peut être fermée puis rouverte avec le bouton FACEIT. Créer une clé adaptée au côté serveur dans [FACEIT App Studio](https://developers.faceit.com/), et la saisir dans Windows. Elle est chiffrée via Electron safeStorage/Windows dans le profil local de l’application, jamais enregistrée dans Supabase ni exposée au renderer. « Oublier la clé » la supprime du PC.

Le processus principal limite les requêtes à des endpoints publics précis de `open.faceit.com/data/v4`, avec délai de 20 secondes et erreurs explicites pour clé invalide, refus, absence de données et limite de débit.

- **Micro → Stats** : pseudo, profil, ELO disponible, statistiques globales/par map, historique paginé par 20 matchs, détail des scores et joueurs.
- **Macro → Opponents** : ID ou URL d’équipe, statistiques, historique partiel reconstitué depuis les 20 derniers matchs des cinq premiers membres, déduplication et filtre sur l’équipe, enregistrement de fiche, export JSON.
- Axes de review calculés par règles sur K/D, HS et taux de victoire. Métriques manquantes affichées « — ». Ce n’est pas une IA ni une analyse des positions de démo.
- Les matchs ESEA et liens de démo ne sont pas tous garantis par la Data API. Ouvrir la salle FACEIT puis importer manuellement le fichier dans la bibliothèque commune.
- Aperçu navigateur de développement : clé client-side en mémoire uniquement, perdue au rechargement. Le chiffrement est propre à Windows.

Documentation : [FACEIT Data API](https://docs.faceit.com/docs/data-api/data/), [authentification](https://docs.faceit.com/docs/data-api/), [TUS Supabase](https://supabase.com/docs/guides/storage/uploads/resumable-uploads), [sécurité Electron](https://www.electronjs.org/docs/latest/tutorial/security).

## Développement

Prérequis : Windows x64, Node.js 22.13+ et npm.

```sh
npm ci
npm test
npx tsc --noEmit
npm run desktop:build
npm run desktop:start
npm run desktop:dist
```

`desktop:dist` compile le client, prépare la distribution et génère l’installateur NSIS. `desktop:start` ouvre le dernier build. L’ancienne cible web reste disponible via `npm run dev` / `npm run build` pour la maintenance ; elle n’est pas requise par les joueurs.

| Dossier | Responsabilité |
|---|---|
| desktop | Fenêtre Windows, pont IPC, clé chiffrée, serveur local, packaging |
| features/tactical | Éditeur radar et historique |
| features/faceit | Configuration, requêtes, statistiques, diagnostic |
| features/demos | Bibliothèque et transferts TUS |
| features/workspace | Timeline, rôles, calendrier, chat, notes, formulaires |
| app/workspace | Navigation, session, données et synchronisation |
| lib/domain | Types partagés, maps, exports |
| supabase | Migrations, RLS et connexion par pseudo |
| tests | Tests FACEIT et SQL reproductibles |

## Validation et limites

Tests du pont FACEIT, données manquantes et diagnostic ; migrations dans PGlite avec substituts Auth/Storage ; protections de rôles et tableaux communs ; TypeScript et compilation du client. Contrôles UI en démonstration : maps, placement sur radar, annuler/rétablir, sauvegarde, Nuke inférieur.

L’administrateur confirme que l’application démarre dans sa session Windows, que sa clé FACEIT fonctionne et que la migration 002 est appliquée. Les transferts/synchronisations entre deux comptes réels restent à tester. Le lecteur 2D DemoQuery, l’import PRACC et les mises à jour automatiques Windows restent absents. Les données de démonstration sont temporaires.

### Résultats sur le poste de test

L’installateur NSIS est généré et son contenu embarqué contrôlé. L’administrateur a confirmé le démarrage depuis sa session Windows. Les essais natifs de l’agent dans son environnement isolé ne reflètent pas ce lancement utilisateur.

Version 0.2.2 : validation des nouveaux membres dans l’application et installateur nommé `noctysstartbook.exe`. Le journal minimal de démarrage `startup.log` reste dans le profil Windows, sans secret ni URL. Le code source est préparé dans la copie Git `work/noctys-release` pour publication sur le dépôt NOCTYS ; voir [publication GitHub](PUBLICATION-GITHUB.md).

