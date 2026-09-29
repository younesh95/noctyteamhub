# Mise à jour 0.5.0

## Installation et connexion d’équipe

Installer [noctysstartbook.exe](https://github.com/younesh95/noctyteamhub/releases/latest/download/noctysstartbook.exe) par-dessus la version existante. L’installateur public contient l’application et les radars, sans adresse de projet Supabase, clé publique ou identifiant FACEIT d’équipe.

1. Obtenir le fichier `noctys-team-config.json` auprès du coach, par un canal privé.
2. Dans **Connecter votre équipe**, importer ce fichier et vérifier l’adresse affichée avec le coach.
3. Cliquer sur **Enregistrer la connexion**, puis se connecter avec son pseudo et son mot de passe habituels.

Le fichier contient seulement `supabaseUrl`, `publishableKey` et, éventuellement, `faceitTeamId`. Aucune clé secrète ni mot de passe n’est accepté. La configuration est conservée dans le dossier de données Windows de l’application. Le bouton **Connexion équipe** sur l’écran de connexion permet de la modifier ; cela déconnecte la session. La clé API FACEIT reste gérée séparément et chiffrée sur le PC.

Aucune nouvelle migration SQL n’est nécessaire pour 0.5.0. Les migrations 001 à 004 restent nécessaires sur un projet vierge. Ne pas les réexécuter si elles ont déjà été appliquées.

## Jouer contre le bot

Dans **Macro → Veto simulator**, choisir BO1 ou BO3, nommer l’équipe A (vous) et l’équipe B (adversaire). Régler les classements de bans fréquents et de maps fortes pour chaque équipe. Cliquer sur **Jouer contre le bot** : choisir une map à chaque tour de l’équipe A ; le bot joue automatiquement les tours de l’équipe B. Il explique ses décisions dans le déroulé.

**Mettre le bot en pause** autorise les choix manuels. **Lancer le bot** reprend le mode sélectionné. **Annuler la dernière étape** met également le bot en pause. **Recommencer** efface le déroulé, mais conserve les profils des équipes ; on peut ensuite changer de mode. **Simuler les deux équipes** automatise les deux côtés. Ce bot utilise des règles pondérées locales, pas un modèle entraîné ni un service externe d’IA.

## Protection et publication

Les accès dépendent des comptes confirmés et activés ainsi que des politiques Supabase RLS. Le choix d’un rôle à l’inscription ne donne aucun privilège. Le processus Windows refuse les connexions hors des projets HTTPS Supabase et les clés privilégiées ; sa politique de contenu limite les connexions réseau au projet configuré. Le serveur local écoute uniquement sur 127.0.0.1 et Electron conserve son isolation et sa sandbox.

Les fichiers de connexion, identifiants, environnements et sorties locales sont exclus de Git. Les tests de publication recherchent les configurations et identifiants intégrés. L’historique public et les anciens installateurs ont été remplacés pour retirer les anciennes configurations. Les copies déjà téléchargées et les éventuels caches externes ne sont pas effacés par cette opération ; les politiques d’accès restent la protection des données.
