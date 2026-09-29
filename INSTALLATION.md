# Installer NOCTYS HQ sur Windows

**Version 0.5.0 :** après installation, importer le fichier `noctys-team-config.json` transmis en privé par le coach, vérifier l’URL affichée et cliquer sur **Enregistrer la connexion**. Cette étape est également nécessaire lors de la première mise à jour depuis 0.4.x. Les comptes existants sont conservés. Ne pas publier ce fichier ni les identifiants sur GitHub. Voir [la notice 0.5.0](MISE-A-JOUR-0.5.0.md).

Pour la version **0.4.0**, appliquer la migration 004 pour le rôle administrateur : voir [la notice de mise à jour](MISE-A-JOUR-0.4.0.md). La sauvegarde des vetos utilise la migration 003. Les membres peuvent installer par-dessus leur version existante.

Télécharger [noctysstartbook.exe](https://github.com/younesh95/noctyteamhub/releases/latest/download/noctysstartbook.exe) depuis la [Release GitHub du projet](https://github.com/younesh95/noctyteamhub/releases/latest), puis l’ouvrir. Une copie locale est produite dans `outputs/windows/noctysstartbook.exe`. L’assistant propose un dossier d’installation et crée un raccourci **NOCTYS HQ**. L’application fonctionne sur Windows x64 et nécessite une connexion internet pour accéder au compte, aux données communes et à FACEIT. Node.js et un navigateur ne sont pas nécessaires pour les joueurs.

L’installateur n’est pas signé avec un certificat éditeur. Windows peut donc afficher un avertissement SmartScreen. Vérifier que le fichier provient bien de la Release du dépôt NOCTYS ; ne pas installer un fichier reçu d’une source inconnue.

Au premier lancement, chacun crée son propre compte : pseudo NOCTYS unique (3 à 24 caractères, lettres, chiffres, tiret ou souligné), adresse email personnelle, mot de passe d’au moins 10 caractères, pseudo FACEIT et rôle demandé. Après validation de l’adresse email, le staff approuve le compte dans **Gérer les membres**. Le rôle demandé n’est jamais accordé automatiquement.

Pour les membres déjà inscrits : **Se connecter** avec le pseudo NOCTYS et le mot de passe, puis renseigner le profil. La clé FACEIT se règle dans le bouton FACEIT de l’application ; elle est enregistrée localement sur le PC Windows, séparément pour chaque installation.

En cas de souci de confirmation email, l’administrateur doit configurer l’envoi SMTP dans Supabase selon [ADMINISTRATION-SUPABASE.md](ADMINISTRATION-SUPABASE.md). Installer une nouvelle version par-dessus l’ancienne conserve normalement les données locales de l’application ; les données d’équipe sont dans Supabase.

Le code source et les migrations sont dans Git. Le fichier d’installation est publié comme **asset de Release GitHub**, car sa taille dépasse la limite usuelle d’un fichier suivi directement par Git.
