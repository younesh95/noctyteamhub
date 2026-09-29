# Utiliser NOCTYS HQ

Après connexion, **Macro gameplay** contient le stratbook, le tableau tactique, les rôles par map, les démos partagées, les adversaires, les anti-strats, le chat et le calendrier de l’équipe. **Micro gameplay** sert aux statistiques FACEIT, au calendrier personnel, aux routines et aux notes individuelles. Les contenus sont synchronisés par Supabase lorsque l’application est connectée.

Pour partager une démo, un coach ou un analyste ouvre **Macro → Demo analyzer**, choisit un fichier `.dem`, une map et un titre, puis lance le transfert. Laisser la fenêtre ouverte jusqu’à la fin et à la publication de la fiche. Un membre actif peut ensuite télécharger la démo depuis sa propre session. Le fichier est dans le bucket privé Supabase `team-files`, pas sur le disque d’un joueur ni sur un serveur Windows à maintenir. Le tableau tactique et les autres fiches communes sont dans `public.records`.

Dans **Gérer les membres**, le staff examine les inscriptions en attente, vérifie le pseudo FACEIT, choisit le rôle accordé et valide. Les joueurs ne peuvent pas s’accorder eux-mêmes des droits. Il n’y a pas de limite de neuf comptes dans le schéma. Les rôles tactiques par map représentent la composition sur le serveur CS2 : on ne peut pas attribuer deux fois le même rôle tactique du même côté.

Pour analyser FACEIT, chaque utilisateur configure sa clé dans le bouton FACEIT. Les statistiques et historiques sont récupérés via l’API. Les axes de travail proposés suivent des règles explicites ; ils ne constituent pas une analyse automatique des positions dans les démos. L’import PRACC, l’extraction automatique de toutes les démos ESEA et le lecteur 2D DemoQuery ne sont pas encore intégrés.

Les modifications simultanées d’un même tableau ou d’une même fiche utilisent la dernière sauvegarde reçue. Pour une séance collaborative, désignez une personne qui édite le plan à la fois.
# Nouveautés 0.3.0

Radars dans les tableaux du stratbook et des anti-strats, sept joueurs configurables, simulateur de veto BO1/BO3 et appels Jitsi intégrés : consulter [la notice détaillée](MISE-A-JOUR-0.3.0.md). La sauvegarde des nouveaux outils nécessite la migration Supabase 003.

# Bot de veto · 0.4.0

Dans **Macro → Veto simulator**, renseigner les noms des deux équipes, le BO1/BO3 et éventuellement la séquence personnalisée. Dans les profils, ajouter les maps aux deux classements de chaque équipe ; les flèches ↑/↓ changent leur ordre et × retire une map. Le premier rang est le plus fréquent/fort. Les classements partiels sont acceptés ; une map absente conserve une valeur neutre.

Choisir **Je joue NOCTYS · bot adversaire (B)**, puis **Lancer le bot** : jouer les tours A sur les cartes, le bot répond aux tours B. **Bot pour les deux équipes** automatise toute la séquence. **Mettre le bot en pause** permet une intervention manuelle. Annuler une étape met également le bot en pause ; relancer pour continuer.

La variation (0–30%) modifie légèrement les scores pour éviter des simulations toujours identiques. Changer la graine avant une nouvelle simulation pour explorer d’autres choix ; même graine et mêmes profils donnent les mêmes décisions. Le bot affiche les raisons de ses choix dans le déroulé. Il s’agit d’un modèle tactique à règles pondérées, sans appels à un service IA ; les scores ne prédisent pas le taux de victoire réel.

Le staff peut **Enregistrer** une préparation, même sans coup joué, et la charger ensuite. Les profils, la graine, l’historique, les explications et les sides sont conservés ensemble dans Supabase (ou temporairement en démonstration). **Recommencer** efface les coups et conserve les profils. **Exporter JSON** exporte ces réglages et le résultat. Les simulations 0.3.0 restent chargeables en mode manuel.
