# NOCTYS HQ 0.4.1

Télécharger [noctysstartbook.exe](https://github.com/younesh95/noctyteamhub/releases/download/v0.4.1/noctysstartbook.exe), fermer NOCTYS HQ et installer par-dessus l’ancienne version. Les données d’équipe restent sur Supabase.

Le correctif 0.4.1 efface le message « Simulation enregistrée » dès qu’un choix ou un réglage change, et verrouille les contrôles pendant la sauvegarde. Les fonctionnalités et la migration sont celles de la mise à jour 0.4.0 ci-dessous.

## Veto

- Bot tactique local pour l’adversaire ou les deux équipes, compatible avec les séquences BO1/BO3 personnalisées.
- Quatre classements ordonnés : bans fréquents et maps fortes de chaque équipe.
- Décisions pondérées et expliquées, variation réglable et graine reproductible.
- Pause, reprise, annulation, sauvegarde des profils avec la simulation et export JSON.
- Les anciennes simulations restent lisibles. Aucune nouvelle migration nécessaire pour le bot si 003 est appliquée.

Le moteur est une heuristique explicable, pas un modèle entraîné sur les matchs. Les classements sont renseignés par le staff : ils ne sont pas automatiquement récupérés depuis FACEIT.

## Administrateur séparé

Appliquer une fois [004_administrator.sql](supabase/migrations/004_administrator.sql), après 003. Le rôle `admin` donne les droits collectifs complets et l’approbation des membres. L’inscription publique ne propose pas ce rôle. Le compte doit être créé dans Auth, son email confirmé et son identité vérifiée avant attribution dans le SQL Editor. Aucun identifiant personnel, mot de passe ni compte spécifique n’est inclus dans Git.

Cette migration ne supprime et ne recrée aucun utilisateur existant. Une recréation demande une opération administrateur distincte après inventaire et sauvegarde des références, afin de conserver strats, messages et fichiers.

## Validation

Tests automatisés du moteur : priorités de ban, forces propres/adverses, cartes déjà prises, reproductibilité, paramètres invalides et 200 simulations BO1/BO3 avec séquences personnalisées. Tests PostgreSQL locaux : migrations et RLS, interdiction d’auto-promotion, protection du rôle admin, droits collectifs et isolation des données personnelles.

Essais d’interface en mode démonstration : BO3 automatisé, réponse adverse en BO1, ordre des classements, pause/annulation, sauvegarde et rechargement. La sauvegarde et la relecture des profils, décisions et graine ont également été vérifiées dans le Supabase réel avec un compte administrateur actif ; la fiche temporaire a été supprimée après le test.
