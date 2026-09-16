# Publication du code et de l’installateur

Le dépôt local n’a actuellement **aucun remote Git configuré**. Ajouter l’URL du dépôt GitHub de l’équipe avec `git remote add origin <URL_DU_DEPOT>` depuis une session qui dispose des droits Git. Le compte d’exécution automatisé de ce workspace reçoit `Permission denied` sur `.git/index.lock` ; le script `scripts/commit-source.cmd` peut être double-cliqué depuis une session Windows autorisée si ce blocage persiste. Sur ce poste, `gh auth status` indique aussi un jeton GitHub CLI invalide pour le compte connecté ; une reconnexion GitHub sera nécessaire si vous utilisez cette CLI. Ne transmettez pas de jeton ou de mot de passe dans cette conversation.

Après le premier commit, pousser la branche vers le dépôt. Pour publier l’installateur, créer et pousser le tag correspondant à la version du `package.json` :

```powershell
git tag v0.2.2
git push origin HEAD
git push origin v0.2.2
```

Le workflow `.github/workflows/windows-release.yml` installe les dépendances, exécute les tests, compile Windows et crée une **Release GitHub** avec `noctysstartbook.exe` en pièce jointe. Vérifier dans l’onglet **Actions** puis **Releases** que le build a réussi et que l’asset est téléchargeable avant d’envoyer le lien aux membres.

L’installateur fait environ 114 Mo. GitHub refuse les fichiers binaires de plus de 100 Mio dans l’historique Git ordinaire ; les Releases acceptent cet asset. Ne pas forcer l’ajout du binaire au dépôt : cela alourdirait chaque clone. Le fichier `outputs/windows/noctysstartbook.exe` et son SHA-256 sont les copies locales à conserver jusqu’à la publication.
