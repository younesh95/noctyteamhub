# Stocker de nombreuses démos CS2

État actuel : NOCTYS HQ conserve les comptes et fiches dans Supabase et transfère les `.dem` vers le bucket privé Supabase `team-files`. Aucun stockage R2, B2 ou serveur Windows n’est encore connecté. Sur un projet Supabase **Free**, la taille globale maximale est de **50 Mo par fichier** et le stockage inclus est de **1 Go**. Le plafond de 500 Mio indiqué par l’application ne relève pas ces limites côté serveur.

Deux voies possibles :

| Solution | Usage adapté | Conséquence pour NOCTYS |
|---|---|---|
| Supabase Pro | Déploiement le plus rapide, volume modéré | Passer le projet en Pro, relever la limite globale Storage, ajuster la limite applicative ; 100 Go de stockage inclus puis facturation au-delà. Vérifier aussi les frais de téléchargement. |
| Stockage d’objets séparé (Cloudflare R2 recommandé pour beaucoup de téléchargements) | Démos très lourdes et bibliothèque volumineuse | Conserver Auth et les métadonnées dans Supabase, déplacer les fichiers vers un bucket R2 privé. L’application doit être adaptée ; la création du bucket seule ne suffit pas. |

Pour R2, la conception prévue est : l’utilisateur se connecte via Supabase Auth ; un service vérifie son jeton et ses droits NOCTYS ; ce service délivre des URL temporaires d’envoi ou de téléchargement ; l’application transfère les démos directement par parties vers R2 ; une fiche Supabase enregistre la clé d’objet, la taille et les informations de review. Seuls les membres actifs lisent les fichiers, et seuls coach/analyste déposent les démos macro. Les clés R2 restent uniquement dans le service, jamais dans l’exécutable ni dans Git. Prévoir une sauvegarde des objets indépendante et une politique de conservation (par exemple archiver les démos anciennes).

Mise en place envisagée, après choix du volume et du fournisseur :

1. Créer un bucket **privé** R2 dédié aux démos, par exemple `noctys-demos`. Choisir l’emplacement des données selon les besoins de l’équipe ; relever l’identifiant du compte et le nom du bucket, sans publier les clés.
2. Créer un jeton R2 limité à ce bucket. Le placer en secret dans le service d’autorisation (Worker ou fonction serveur), jamais dans l’exécutable Windows. Le service valide le JWT Supabase et le rôle avant de signer un transfert.
3. Adapter NOCTYS HQ pour envoyer les gros fichiers par parties, reprendre un transfert interrompu et télécharger par URL signée de courte durée. Les métadonnées restent dans `public.records`, avec un indicateur de fournisseur afin que les anciennes démos Supabase continuent à fonctionner.
4. Tester avec deux comptes distincts : dépôt par un coach, lecture par un joueur actif, accès refusé à un compte en attente, puis vérification des quotas et de la facture. Migrer ensuite les anciennes démos si nécessaire.

L’application Windows utilise actuellement une adresse locale dont le port varie à chaque lancement. Pour les transferts directs depuis son interface, il faut traiter les règles CORS du bucket ; un pont natif de transfert évite de dépendre d’une origine locale fixe. Le bucket doit rester privé dans les deux cas.

Cette connexion R2 **n’est pas encore déployée**. Fournir uniquement l’identifiant du compte et le nom du bucket une fois créés ; les secrets seront à saisir dans le tableau de bord du service choisi.

Tarifs publics consultés le 16 septembre 2026 : R2 Standard affiche **10 Go/mois gratuits**, puis **0,015 $/Go-mois**, des opérations facturées au-delà du quota gratuit et une sortie réseau R2 gratuite. Pour 1 To stocké en continu, le stockage seul est de l’ordre de 15 $/mois, hors opérations et taxes. Backblaze B2 annonce un tarif de départ de **6,95 $/To-mois**, avec sortie gratuite jusqu’à trois fois le stockage moyen puis facturée ; il peut être intéressant si les téléchargements restent modérés. Supabase Pro comprend 100 Go, puis **0,0213 $/Go** de stockage supplémentaire, en plus du forfait et des autres usages. Vérifier les tarifs avant toute souscription.

Pour choisir et paramétrer la solution, relever la taille moyenne et maximale d’une démo, le nombre de démos ajoutées par mois, la durée de conservation et le nombre de téléchargements prévus. Une démo de 1 Go consultée une fois par chacun des neuf membres entraîne environ 9 Go de sortie réseau ; ce trafic compte autant que la capacité stockée dans le choix de l’offre.

Sources : [limites Supabase](https://supabase.com/docs/guides/storage/uploads/file-limits), [tarifs Supabase](https://supabase.com/pricing), [tarifs Cloudflare R2](https://developers.cloudflare.com/r2/pricing/), [chargement multipart R2](https://developers.cloudflare.com/r2/objects/upload-objects/), [tarifs Backblaze B2](https://www.backblaze.com/cloud-storage/pricing).
