# NOCTYS HQ 0.6.0

## Stratbook Builder : tableau animé

Dans Macro → Stratbook builder, sélectionner une stratégie puis Tactical board. La carte suit celle de la stratégie, y compris Cache et les deux étages de Nuke. Les anciens repères sont repris à l’ouverture et conservés dans les données d’origine.

- Choisir Joueur, son camp T/CT et son numéro, puis cliquer sur la carte.
- Choisir Sélection pour déplacer un objet. Pour un joueur, placer le curseur à un autre timing, puis déplacer le joueur pour ajouter une étape. Une nouvelle position au même timing remplace cette étape.
- Tracer des flèches, lignes, dessins libres, rectangles ou ellipses. Ajouter texte, smoke, flash, molotov, HE, decoy ou bombe. Couleur et épaisseur s’appliquent aux nouveaux dessins.
- Lire le round de 2:15 à 0:05, avec vitesse réglable. Les positions sont interpolées entre les étapes. Il n’y a pas de calcul des collisions ou des chemins à travers la navigation CS2 : placer les étapes intermédiaires nécessaires.
- Le mode Grenades temporisées affiche une smoke pendant 20 secondes, un molotov pendant 7 secondes et les autres repères de grenade pendant 2 secondes. Il ne simule pas la physique des lancers.
- Annuler, rétablir et vider le tableau. Le vidage peut être annulé avant fermeture.
- Cliquer sur **Enregistrer le tableau** pour partager le plan avec l’équipe. Un brouillon de session est conservé pendant les changements d’onglet ; il ne remplace pas la sauvegarde Supabase. Les joueurs consultent et exportent, le staff modifie.
- Exporter le plan JSON ou une image SVG contenant le radar. L’export de stratégie complet comprend aussi le plan animé. Pas d’export vidéo/GIF ni de lien public de partage dans cette version.

Fonctionnement inspiré du [StratPad de CS2Analysis](https://cs2analysis.com/stratpad/?map=de_cache), sans reprise de son code ou de son moteur de navigation.

## Autres améliorations préparées pour cette version

Cinq lignes automatiques pour les stratégies selon les spawns (Spawn 1 à droite, Spawn 5 à gauche), profils adversaires enregistrables dans le veto et comparaison des choix humains aux conseils du bot, notes de review classées par round transformables en exercices, compositions de cinq titulaires parmi sept avec disponibilités et rôles de match, présentation du tableau macro en direct par un membre du staff.

Appliquer une seule fois `supabase/migrations/005_preparation.sql` après 004 pour les disponibilités et présentations. Ne pas réexécuter si déjà appliquée. Le nouveau Stratpad utilise le champ JSON des stratégies et ne nécessite aucune migration supplémentaire. Le direct est une présentation avec actualisation périodique, pas une édition simultanée.

Le formulaire Mot de passe oublié permet de saisir le code reçu par email dans l’application. Remplacer le modèle Supabase Reset Password par `supabase/templates/recovery.html` pour utiliser ce parcours. L’envoi nécessite un SMTP fonctionnel.

L’application Windows propose désormais la recherche de mises à jour GitHub, leur téléchargement avec vérification SHA-256, puis l’installation après action de l’utilisateur. Pour passer de 0.5.0 à cette version, télécharger manuellement l’installateur. Les exécutables restent non signés.

Le serveur externe pour les grosses démos reste différé en attendant les informations de l’hébergeur. Les fichiers existants restent dans le Storage Supabase privé.
