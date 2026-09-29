# NOCTYS HQ — Windows

Application CS2 pour NOCTYS : préparation collective, entraînement individuel, tableaux tactiques, statistiques FACEIT et bibliothèque commune de démos. Interface française noire et violette.

## Installation

Télécharger [noctysstartbook.exe — Windows x64](https://github.com/younesh95/noctyteamhub/releases/latest/download/noctysstartbook.exe), lancer l’assistant puis ouvrir **NOCTYS HQ** depuis le raccourci. Une copie locale est disponible dans `outputs/windows/noctysstartbook.exe`. Les joueurs n’ont besoin ni de Node.js ni d’un navigateur ou serveur à démarrer. Electron embarque l’interface et la sert sur une adresse 127.0.0.1 aléatoire accessible uniquement sur le PC. Internet est requis pour les comptes et données communes. Voir [installation](INSTALLATION.md), [utilisation](UTILISATION.md), [administration Supabase](ADMINISTRATION-SUPABASE.md) et [stockage des grosses démos](STOCKAGE-DEMOS.md).

L’installateur est non signé : aucun certificat éditeur n’a été fourni. Les mises à jour automatiques ne sont pas configurées. Les exécutables et fichiers personnels sont exclus des commits Git ; le workflow de Release publie l’installateur et son SHA-256 dans les [Releases GitHub](https://github.com/younesh95/noctyteamhub/releases). Voir [publication GitHub](PUBLICATION-GITHUB.md).

## Activation Supabase

Depuis **0.5.0**, aucune adresse de projet, clé ou identité de membre n’est intégrée au code ni à l’installateur. Au premier lancement, importer le fichier de connexion remis en privé par le coach. Voir [la notice 0.5.0](MISE-A-JOUR-0.5.0.md). La clé publishable est une clé cliente ; Supabase Auth et les politiques RLS protègent les données.

**Mise à jour 0.4.0 : exécuter une fois [004_administrator.sql](supabase/migrations/004_administrator.sql) dans le SQL Editor Supabase pour le nouveau rôle administrateur.** Le bot de veto utilise les sauvegardes de la migration 003 déjà appliquée. Pour un projet vierge, exécuter 001, 002, 003 puis 004. Ne pas réexécuter les migrations déjà installées. Aucun compte Auth n’est créé ou supprimé par ces migrations.

Déployer aussi la fonction Edge `username-login` avec `verify_jwt=false` (voir `supabase/config.toml`). Les secrets de service restent dans Supabase. La connexion Windows appelle cette fonction depuis le processus principal. L’ancien aperçu web passe par `/api/login`.

Les comptes confirment leur email puis le staff valide leur rôle dans **Gérer les membres**, via `public.approve_member`. Le premier coach actif existe déjà sur le projet NOCTYS. Choisir coach à l’inscription ne donne pas de privilèges. Le schéma accepte les neuf membres sans nouvelle migration ; pour envoyer leurs confirmations, configurer un SMTP personnalisé dans Supabase.

## Serveur commun des démos

**Macro → Demo analyzer** : le coach ou l’analyste choisit un titre, une map et un fichier `.dem`. Les fichiers sont conservés dans le bucket privé `team-files` ; les fiches sont des enregistrements `demo` de portée `team`. Tous les membres actifs peuvent consulter et télécharger les démos via une URL signée temporaire. Le staff ajoute les notes de review.

Supabase existant sert de serveur commun, sans PC d’équipe toujours allumé. Transfert TUS par blocs de 6 Mio, progression, tentatives automatiques et pause/reprise dans la fenêtre ouverte. Le transfert continue pendant le changement d’onglet. Fermer l’application interrompt le transfert ; la reprise après fermeture n’est pas implémentée. Si le fichier est transféré mais la fiche échoue, un bouton permet de réessayer sa publication.

Limite applicative : 500 Mio. La limite globale du projet prime ; sur le plan Supabase Free, elle ne peut pas dépasser 50 Mo par fichier selon la [documentation Supabase](https://supabase.com/docs/guides/storage/uploads/file-limits). Aucune offre payante n’est activée automatiquement. Prévoir une sauvegarde séparée des objets Storage, en plus de la base de données.

Pour utiliser les disques d’un serveur existant, voir [manuel externe](SERVEUR-DEMOS.md). Cette connexion externe reste à développer et à déployer ; elle n’est pas incluse dans la version 0.3.0.

## Pool et Tactical board

Maps: **Dust2, Mirage, Anubis, Cache, Ancient, Nuke, Inferno**. Centralisé dans `lib/domain/model.ts`. Les anciennes valeurs Dust II sont normalisées à la lecture ; les archives des maps sorties du pool sont conservées.

**Macro → Tactical board** : fonds radar embarqués, niveau inférieur de Nuke, joueurs, flèches de déplacement, dessin libre, smoke/flash/molotov/HE, texte, couleurs et timing 2:15 → 0:05. Déplacement et effacement des objets, annuler/rétablir, zoom, sauvegarde collective, exports JSON et image SVG autonome avec radar. Les joueurs consultent ; coach et analyste éditent. La dernière sauvegarde reçue remplace la précédente : pas de fusion de coédition simultanée.

Usages inspirés de [CSGO Board](https://csgoboard.com/), sans dépendance à son code ou son service. Radars appartenant à Valve Corporation, fournis par [cs2-map-icons](https://github.com/MurkyYT/cs2-map-icons), récupérés le 16 septembre 2026. Voir `public/radars/NOTICE.md`.

Depuis 0.3.0, les tableaux intégrés au **Stratbook** et aux **Anti-strats** affichent également le radar de leur map, avec les deux niveaux de Nuke. Les repères anciens conservent leurs coordonnées en pourcentage ; vérifier leur position sur le nouveau fond. Le placement du tableau principal tient compte du zoom et une modification pendant la sauvegarde reste signalée comme non enregistrée.

## Appels, veto et sept joueurs

- **Team call** : le staff crée un salon, chaque membre clique sur Rejoindre. Jitsi est intégré dans une iframe isolée et reste dans un petit panneau en changeant d’onglet. Le service public `meet.jit.si` peut demander une authentification à l’organisateur. Utiliser les contrôles Jitsi pour le micro, la caméra, le lobby et le mot de passe. Le lien du salon ne bénéficie pas des droits Supabase : protéger l’accès dans Jitsi. Sous Windows, une confirmation précède le partage de la seule fenêtre NOCTYS ; le son système n’est pas partagé. L’application ne conserve pas d’enregistrement audio/vidéo. Voir [Jitsi](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe/).
- **Veto simulator** : BO1 (six bans + decider) ou BO3 (quatre bans, deux picks + decider), équipe et action personnalisables à chaque étape. Bot tactique local pour l’adversaire ou les deux équipes : classements de bans fréquents et maps fortes pour chacun, variation reproductible par graine, pause et explication de chaque décision. Profils, déroulé et sides sont enregistrés/exportés ensemble. Ce modèle combine des règles pondérées, sans LLM ni apprentissage automatique ; aucun choix n’est envoyé à FACEIT. Voir [la notice 0.4.0](MISE-A-JOUR-0.4.0.md).
- **Player roles** : sept emplacements nommables et associables aux comptes actifs joueur/IGL. L’effectif est indépendant des inscriptions. Les remplaçants peuvent rester sans rôle pour conserver l’unicité sur chaque map et side. Aucun faux compte utilisateur n’est créé.

Voir [la notice de mise à jour 0.3.0](MISE-A-JOUR-0.3.0.md) pour l’installation et les vérifications à deux membres.

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

Version 0.2.2 : validation des nouveaux membres dans l’application et installateur nommé `noctysstartbook.exe`. Le journal minimal de démarrage `startup.log` reste dans le profil Windows, sans secret ni URL. Voir [publication GitHub](PUBLICATION-GITHUB.md) pour générer et distribuer l’installateur.

