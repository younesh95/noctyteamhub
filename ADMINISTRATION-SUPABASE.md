# Administrer les neuf comptes et les démos

Le projet commun est `https://adrleyvcufedeologxnx.supabase.co`. Les migrations `001_noctys.sql` et `002_desktop_boards.sql` ont été appliquées selon le retour de l’administrateur. **Ne pas les relancer** sur le projet existant. Aucun SQL supplémentaire n’est nécessaire pour neuf membres. Chaque personne peut installer la même application : les comptes sont distincts par email Supabase et pseudo NOCTYS unique, sans différencier les installations par PC.

## Inscriptions et emails

Dans le tableau de bord Supabase, vérifier **Authentication → Providers → Email** : inscription par email activée et confirmation d’email activée. Configurer ensuite un **SMTP personnalisé** dans les paramètres Authentication avec l’hôte, le port, l’utilisateur, le mot de passe et l’adresse d’expéditeur fournis par votre prestataire email. Ne mettre ces identifiants ni dans Git ni dans l’application. Tester une inscription avec une adresse externe au projet, puis le lien de confirmation et la connexion dans NOCTYS HQ. Vérifier le dossier spam et les journaux Auth/SMTP en cas d’échec.

Le service email intégré de Supabase ne livre qu’aux adresses autorisées dans l’équipe du projet et est actuellement limité à deux messages par heure ; il n’est pas adapté à neuf inscriptions. Avec un SMTP personnalisé, consulter et ajuster les limites d’envoi dans **Authentication → Rate Limits** selon le prestataire. Garder l’email de confirmation activé.

La personne qui demande « coach » ou « analyste » reste `joueur` et `active=false` jusqu’à une décision du staff. Un coach ou analyste actif ouvre **Gérer les membres**, examine la demande et choisit le rôle accordé. Le RPC `approve_member` vérifie ces droits dans la base. Les comptes en attente n’accèdent pas aux données d’équipe. Ne partagez pas le compte coach : chacun possède son propre compte.

## Données partagées

Supabase est le serveur commun déjà mis en place. Les profils sont dans `public.profiles`, les fiches (strats, tableaux, notes et références de démos) dans `public.records` et les fichiers `.dem` dans **Storage → Buckets → team-files**. Le bucket est privé, et les membres actifs téléchargent via des liens temporaires. Les droits sont définis par les politiques RLS des migrations. Les joueurs n’ont rien à configurer dans Supabase : installer l’application et se connecter suffit.

Le bucket définit une limite de 500 Mio par fichier, mais la **limite globale du projet Supabase s’applique d’abord**. À la date de cette notice, un projet Free ne peut pas dépasser 50 Mo par fichier ; les démos plus grandes nécessitent un plan/paramètre compatible ou un stockage externe à concevoir. Vérifier **Storage → Settings → Global file size limit**, puis quotas, trafic et sauvegardes. Une sauvegarde SQL seule n’inclut pas nécessairement les objets Storage : prévoir une sauvegarde des démos séparée.

Sources : [SMTP Supabase](https://supabase.com/docs/guides/auth/auth-smtp), [limites d’envoi](https://supabase.com/docs/guides/auth/rate-limits), [limites de fichiers Storage](https://supabase.com/docs/guides/storage/uploads/file-limits).
