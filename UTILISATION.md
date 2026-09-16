# Utiliser NOCTYS HQ

Après connexion, **Macro gameplay** contient le stratbook, le tableau tactique, les rôles par map, les démos partagées, les adversaires, les anti-strats, le chat et le calendrier de l’équipe. **Micro gameplay** sert aux statistiques FACEIT, au calendrier personnel, aux routines et aux notes individuelles. Les contenus sont synchronisés par Supabase lorsque l’application est connectée.

Pour partager une démo, un coach ou un analyste ouvre **Macro → Demo analyzer**, choisit un fichier `.dem`, une map et un titre, puis lance le transfert. Laisser la fenêtre ouverte jusqu’à la fin et à la publication de la fiche. Un membre actif peut ensuite télécharger la démo depuis sa propre session. Le fichier est dans le bucket privé Supabase `team-files`, pas sur le disque d’un joueur ni sur un serveur Windows à maintenir. Le tableau tactique et les autres fiches communes sont dans `public.records`.

Dans **Gérer les membres**, le staff examine les inscriptions en attente, vérifie le pseudo FACEIT, choisit le rôle accordé et valide. Les joueurs ne peuvent pas s’accorder eux-mêmes des droits. Il n’y a pas de limite de neuf comptes dans le schéma. Les rôles tactiques par map représentent la composition sur le serveur CS2 : on ne peut pas attribuer deux fois le même rôle tactique du même côté.

Pour analyser FACEIT, chaque utilisateur configure sa clé dans le bouton FACEIT. Les statistiques et historiques sont récupérés via l’API. Les axes de travail proposés suivent des règles explicites ; ils ne constituent pas une analyse automatique des positions dans les démos. L’import PRACC, l’extraction automatique de toutes les démos ESEA et le lecteur 2D DemoQuery ne sont pas encore intégrés.

Les modifications simultanées d’un même tableau ou d’une même fiche utilisent la dernière sauvegarde reçue. Pour une séance collaborative, désignez une personne qui édite le plan à la fois.
