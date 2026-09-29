# Administrer les neuf comptes et les démos

**Nouveauté 0.4.0 :** [004_administrator.sql](supabase/migrations/004_administrator.sql) ajoute le rôle applicatif `admin`. Il possède les droits collectifs du staff et du calendrier, sans accès général aux contenus personnels des autres membres. L’inscription publique ne peut pas demander ou obtenir ce rôle ; son attribution se fait dans le SQL Editor après vérification de l’identité et de l’email confirmé. Les coachs/analystes ne peuvent ni créer ni rétrograder un administrateur via `approve_member`. Ce compte n’est pas un accès au tableau de bord Supabase et ne contient aucune clé de service.

Supprimer un compte Auth peut supprimer son profil et bloquer les références de contenus. Avant toute recréation : vérifier l’identité exacte, sauvegarder les données et inventorier contenus créés, destinataires, références JSON et objets Storage. Ne pas supprimer de fichiers pour contourner un blocage de suppression du compte. Utiliser un accès Supabase privilégié pour ces opérations ; aucun outil de suppression publique n’est ajouté à l’application.

**Nouveautés 0.3.0 :** appliquer une fois [003_team_tools.sql](supabase/migrations/003_team_tools.sql) pour les sauvegardes d’effectif à sept joueurs, de veto et de salons Jitsi. Voir [la procédure](MISE-A-JOUR-0.3.0.md). Cette migration concerne les nouveaux outils ; le nombre de comptes demeure indépendant des sept emplacements de joueurs.

L’adresse du projet commun est transmise dans le fichier de connexion privé de l’équipe. **Ne pas relancer les migrations déjà appliquées** sur un projet existant. Aucun SQL supplémentaire n’est nécessaire pour neuf membres. Chaque personne peut installer la même application : les comptes sont distincts par email Supabase et pseudo NOCTYS unique, sans différencier les installations par PC.

## Inscriptions et emails

Dans le tableau de bord Supabase, vérifier **Authentication → Providers → Email** : inscription par email activée et confirmation d’email activée. Configurer ensuite un **SMTP personnalisé** dans les paramètres Authentication avec l’hôte, le port, l’utilisateur, le mot de passe et l’adresse d’expéditeur fournis par votre prestataire email. Ne mettre ces identifiants ni dans Git ni dans l’application. Tester une inscription avec une adresse externe au projet, puis le lien de confirmation et la connexion dans NOCTYS HQ. Vérifier le dossier spam et les journaux Auth/SMTP en cas d’échec.

Le service email intégré de Supabase ne livre qu’aux adresses autorisées dans l’équipe du projet et est actuellement limité à deux messages par heure ; il n’est pas adapté à neuf inscriptions. Avec un SMTP personnalisé, consulter et ajuster les limites d’envoi dans **Authentication → Rate Limits** selon le prestataire. Garder l’email de confirmation activé.

La personne qui demande « coach » ou « analyste » reste `joueur` et `active=false` jusqu’à une décision du staff. Un coach ou analyste actif ouvre **Gérer les membres**, examine la demande et choisit le rôle accordé. Le RPC `approve_member` vérifie ces droits dans la base. Les comptes en attente n’accèdent pas aux données d’équipe. Ne partagez pas le compte coach : chacun possède son propre compte.

## Données partagées

Supabase est le serveur commun déjà mis en place. Les profils sont dans `public.profiles`, les fiches (strats, tableaux, notes et références de démos) dans `public.records` et les fichiers `.dem` dans **Storage → Buckets → team-files**. Le bucket est privé, et les membres actifs téléchargent via des liens temporaires. Les droits sont définis par les politiques RLS des migrations. Les joueurs n’ont rien à configurer dans Supabase : installer l’application et se connecter suffit.

Le bucket définit une limite de 500 Mio par fichier, mais la **limite globale du projet Supabase s’applique d’abord**. À la date de cette notice, un projet Free ne peut pas dépasser 50 Mo par fichier ; les démos plus grandes nécessitent un plan/paramètre compatible ou un stockage externe à concevoir. Vérifier **Storage → Settings → Global file size limit**, puis quotas, trafic et sauvegardes. Une sauvegarde SQL seule n’inclut pas nécessairement les objets Storage : prévoir une sauvegarde des démos séparée.

Sources : [SMTP Supabase](https://supabase.com/docs/guides/auth/auth-smtp), [limites d’envoi](https://supabase.com/docs/guides/auth/rate-limits), [limites de fichiers Storage](https://supabase.com/docs/guides/storage/uploads/file-limits).
