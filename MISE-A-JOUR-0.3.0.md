# Mise à jour NOCTYS HQ 0.3.0

## Administrateur — Supabase

Dans le projet `votre projet Supabase`, ouvrir **SQL Editor → New query**, coller tout le contenu de [003_team_tools.sql](supabase/migrations/003_team_tools.sql), puis exécuter une seule fois. La transaction ajoute les types `roster`, `veto` et `call`, valide les sept emplacements et conserve les politiques RLS existantes : lecture par les membres actifs, écriture par coach/analyste. Ne pas relancer 001 et 002. La migration a été testée dans une base PostgreSQL locale PGlite ; son application au projet réel doit être effectuée par l’administrateur.

« Success. No rows returned » est le résultat attendu. Aucun mot de passe, compte ou ancien document n’est modifié. Sans 003, les nouveaux onglets s’affichent mais leurs sauvegardes échouent.

## Chaque membre — Windows

Fermer NOCTYS, télécharger [noctysstartbook.exe](https://github.com/younesh95/noctyteamhub/releases/latest/download/noctysstartbook.exe), puis installer par-dessus la version actuelle. Conserver le même dossier. Les comptes et documents d’équipe restent dans Supabase ; la clé FACEIT reste dans le profil Windows local. L’installateur n’est pas signé et il n’y a pas de mise à jour automatique.

## Cartes et préparation

Le Tactical board principal, les tableaux des stratégies et les anti-strats affichent les radars embarqués des sept maps. Nuke possède un sélecteur supérieur/inférieur. Pour les anciens repères placés sur la grille abstraite, vérifier et ajuster la position sur le radar.

Dans **Veto simulator**, saisir les noms des équipes, choisir BO1/BO3 et personnaliser si nécessaire les six étapes. BO1 attend six bans ; BO3 quatre bans et deux picks. Cliquer les cartes dans l’ordre ; la dernière map est le decider. Annuler revient d’une étape. Les sides sont renseignés manuellement. Le staff peut sauvegarder une simulation, les membres peuvent la charger et tous peuvent l’exporter.

Dans **Player roles → Configurer l’effectif**, nommer les sept joueurs. Associer un compte seulement après son inscription et son activation comme joueur ou IGL. Les deux emplacements supplémentaires sont des places d’effectif, pas des comptes de connexion. Laisser les joueurs de réserve sans rôle si nécessaire.

## Appels Jitsi

1. Le coach ou l’analyste crée un salon dans **Team call**.
2. Les membres actifs ouvrent le même salon avec **Rejoindre**. Internet et l’accès à `meet.jit.si` sont nécessaires. Si le panneau reste vide, utiliser **Recharger Jitsi** ; un lien vers le navigateur est aussi proposé.
3. L’organisateur suit si nécessaire la connexion demandée par Jitsi. Activer un lobby ou un mot de passe pour limiter l’accès : les personnes possédant le lien ne sont pas filtrées par Supabase.
4. Activer volontairement le micro/la caméra. Windows demande l’autorisation pour l’appel.
5. Dans Jitsi, cliquer **Partager votre écran**. La version Windows propose uniquement la fenêtre NOCTYS, après confirmation. Tous les onglets et messages ouverts dans cette fenêtre deviennent visibles aux participants. Le son système n’est pas partagé.
6. Naviguer dans le stratbook, les rôles ou le veto : l’appel reste dans un petit panneau. **Quitter l’appel** ferme l’iframe et coupe l’accès aux périphériques pour cet appel. Fermer l’application termine également la connexion.

Les salons sont hébergés sur le service public Jitsi, pas sur le serveur de démos. NOCTYS n’enregistre pas les flux. La disponibilité, l’authentification et les règles du service Jitsi restent indépendantes de NOCTYS.

## Vérifications et limites

Tests automatisés : séquences BO1/BO3 et personnalisées, doubles picks/bans invalides, permissions média, migrations et RLS, TypeScript, compilation du client. Contrôles visuels en mode démonstration : radar Mirage du stratbook avec placement, Nuke inférieur, veto BO3 complet et sauvegarde temporaire, sept joueurs, maintien du panneau d’appel en navigation.

Le service Jitsi et son écran d’entrée sont accessibles directement sur ce poste. L’iframe est restée vide dans l’aperçu intégré de test : le chargement intégré, la connexion de l’organisateur et un appel réel avec partage Windows restent à valider avec deux membres après installation. Aucun accès au micro, à la caméra ou à l’écran de l’utilisateur n’a été activé pour ces tests.

Après migration et installation, vérifier avec un second compte réel : lecture d’un veto enregistré, visibilité du même salon, audio dans les deux sens, partage de NOCTYS en changeant d’onglet, puis arrêt du partage après avoir quitté. Signaler toute erreur affichée avec le nom de l’onglet et la version 0.3.0.
