# Publication du code et de l’installateur

Le dépôt distant est `https://github.com/younesh95/noctyteamhub.git`. Le dépôt Git initial de ce workspace refuse l’écriture de `.git/index.lock` au compte d’exécution. Un commit du code est donc préparé dans la copie propre `work/noctys-release`, qui possède déjà ce remote. Le jeton GitHub CLI du poste est expiré : il faut terminer la connexion GitHub avant le push. Ne transmettez pas de jeton ou de mot de passe dans cette conversation.

Après authentification, pousser la branche préparée. Pour publier l’installateur, créer et pousser le tag correspondant à la version du `package.json` depuis cette même copie :

```powershell
git -C work/noctys-release -c http.sslBackend=openssl push -u origin main
git -C work/noctys-release tag v0.2.2
git -C work/noctys-release -c http.sslBackend=openssl push origin v0.2.2
```

Le workflow `.github/workflows/windows-release.yml` installe les dépendances, exécute les tests, compile Windows et crée une **Release GitHub** avec `noctysstartbook.exe` en pièce jointe. Vérifier dans l’onglet **Actions** puis **Releases** que le build a réussi et que l’asset est téléchargeable avant d’envoyer le lien aux membres.

L’installateur fait environ 114 Mo. GitHub refuse les fichiers binaires de plus de 100 Mio dans l’historique Git ordinaire ; les Releases acceptent cet asset. Ne pas forcer l’ajout du binaire au dépôt : cela alourdirait chaque clone. Le fichier `outputs/windows/noctysstartbook.exe` et son SHA-256 sont les copies locales à conserver jusqu’à la publication.
