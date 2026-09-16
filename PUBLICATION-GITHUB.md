# Publication du code et de l’installateur

Dépôt : [younesh95/noctyteamhub](https://github.com/younesh95/noctyteamhub). Une fois la première publication réussie, les membres pourront télécharger `noctysstartbook.exe` depuis la [dernière Release](https://github.com/younesh95/noctyteamhub/releases/latest), sans compiler le code.

Le workflow `.github/workflows/windows-release.yml` installe les dépendances, exécute les tests, vérifie TypeScript, compile Windows et publie l’installateur avec `SHA256SUMS.txt`. Il démarre lors d’un changement de `package.json` ou de ce workflow sur `main`, lors d’un tag `v*`, ou manuellement dans **Actions → Windows release → Run workflow**. La version provient de `package.json` ; un tag fourni doit lui correspondre. Une nouvelle exécution de la même version remplace ses pièces jointes.

Pour une future version, modifier le numéro de version et son lockfile, vérifier les changements, committer puis pousser sur `main` :

```powershell
npm version patch --no-git-tag-version
npm test
npx tsc --noEmit
git add package.json package-lock.json
git commit -m "Prepare next Windows release"
git push origin main
```

Le workflow crée le tag correspondant au commit construit. Vérifier dans **Actions** puis **Releases** que le build a réussi et que le fichier est téléchargeable avant d’envoyer le lien aux membres. Si une publication échoue, la Release précédente reste disponible ; une simple modification de documentation ne déclenche pas de build.

L’installateur fait environ 114 Mo. GitHub refuse les fichiers de plus de 100 Mio dans l’historique Git ordinaire ; les Releases acceptent cet asset. Les installateurs sont donc exclus du dépôt source. Conserver uniquement l’installateur actuel dans la livraison locale ; l’historique du code reste utile pour la maintenance.

Sur le poste de préparation initial, la copie Git de travail est `work/noctys-release` car le dossier `.git` du workspace parent refuse l’écriture. Sur un autre poste, utiliser simplement un clone normal du dépôt. Pour les commandes Git locales, se connecter avec Git Credential Manager ou `gh auth login --hostname github.com --git-protocol https --web --scopes workflow` sans partager de jeton dans la conversation. Le droit `workflow` permet d’envoyer le fichier GitHub Actions.

Après la connexion, la première publication préparée s’envoie avec `git -C work/noctys-release -c http.sslBackend=openssl push -u origin main`. Ce réglage utilise OpenSSL avec vérification des certificats, car le moteur TLS Windows du compte d’exécution ne fonctionne pas dans cet environnement.
