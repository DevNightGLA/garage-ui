# Lancer l'application « Gestion de garages » sur son ordinateur

Ce guide est identique dans les deux projets : **garage-api** (le back-end, l'API) et **garage-web** (le front-end,
l'interface). Il faut les deux pour utiliser l'application : le front affiche les écrans, le back garde les données dans
une base PostgreSQL.

```
navigateur ──> garage-web (http://localhost:4200) ──/api──> garage-api (http://localhost:8080) ──> PostgreSQL (port 5432, dans Docker)
```

## 1. Ce qu'il faut installer

| Outil | Version | Pour quoi | Où le trouver |
| --- | --- | --- | --- |
| **Git** | récente | récupérer les deux projets | <https://git-scm.com> |
| **Docker Desktop** | récente | la base de données PostgreSQL 17, et les tests du back | <https://www.docker.com/products/docker-desktop> |
| **Java (JDK) 25** | 25 | lancer le back | par exemple Eclipse Temurin : <https://adoptium.net> |
| **Node.js** | 22.22.3 ou plus récent en 22, 24.15 ou plus récent en 24, ou 26 et plus (npm est fourni avec Node) | lancer le front | <https://nodejs.org> |

Maven n'est pas à installer : le back contient son propre lanceur (`./mvnw`, ou `mvnw.cmd` sous Windows).
Un éditeur est facultatif (IntelliJ IDEA, VS Code…).

Pour vérifier les installations, dans un terminal :
```bash
git --version
docker --version
java -version
node --version
```
`java -version` doit afficher 25 et `node --version` une des versions du tableau. Docker Desktop doit être **démarré**
(icône de la baleine active) avant de lancer la base.

## 2. Récupérer les projets

Placer les deux projets côte à côte, dans le même dossier :
```bash
git clone https://github.com/DevNightGLA/garage-api.git
git clone https://github.com/DevNightGLA/garage-ui.git garage-web
```
Le travail à jour est sur la branche `develop` :
```bash
cd garage-api && git checkout develop && cd ..
cd garage-web && git checkout develop && cd ..
```

## 3. Lancer le back-end (garage-api)

Dans un premier terminal, depuis le dossier `garage-api` :

1. Démarrer la base de données (Docker doit tourner) :
   ```bash
   docker compose up -d
   ```
   Cela crée un conteneur `garages-postgres` : base `garages`, utilisateur `garages`, mot de passe `garages`, port 5432
   (accessible seulement depuis l'ordinateur). Les données sont gardées dans un volume Docker entre deux démarrages.

2. Démarrer l'API avec le jeu de démonstration :
   ```bash
   ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
   ```
   Sous Windows (invite de commandes) : `mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev`.

   Le premier lancement télécharge les dépendances, ce qui peut prendre quelques minutes. L'API est prête quand le
   terminal affiche `Started GarageApiApplication`. Elle répond sur <http://localhost:8080>. Le profil `dev` :
   - crée les tables et charge des données de démonstration (garages, locataires, locations, paiements, remarques) ;
   - fournit un secret de connexion local (aucune variable à définir) ;
   - n'envoie aucun e-mail : les e-mails (mot de passe oublié, messages aux locataires) sont **écrits dans ce terminal**.

Laisser ce terminal ouvert tant qu'on utilise l'application.

## 4. Lancer le front-end (garage-web)

Dans un second terminal, depuis le dossier `garage-web` :
```bash
npm install
```
(une seule fois, puis après chaque mise à jour du projet), puis :
```bash
npm start
```
L'interface est prête quand le terminal affiche l'adresse <http://localhost:4200> : l'ouvrir dans un navigateur. Le front
transmet tous les appels `/api` au back du port 8080 : **le back doit être lancé**.

## 5. Se connecter : comptes par défaut

Avec le profil `dev`, tous les comptes ont le mot de passe **`Garages2026!`**.

| Login | Profil | À quoi il sert |
| --- | --- | --- |
| **`admin`** | Admin | **Compte à utiliser par défaut** : tous les écrans, y compris Configuration (utilisateurs, droits d'accès, paramètres, journal d'audit, maintenance) |
| `gestionnaire` | Gestionnaire | Comme l'Admin, sans le menu Configuration |
| `consultant` | Consultant | Mêmes écrans que le Gestionnaire, en consultation seule |
| `mdupont` | Locataire | Ne voit que ses propres garages, locations, loyers et paiements (fiche de Marie Dupont) |
| `nouveau` | Consultant | A un mot de passe temporaire : l'application demande d'en choisir un nouveau à la connexion |
| `ancien.gestionnaire` | Gestionnaire | Compte désactivé : la connexion est refusée |

Les données de démonstration sont datées d'octobre 2026.

## 6. Arrêter, recommencer à zéro

- Arrêter le front ou l'API : `Ctrl + C` dans leur terminal.
- Arrêter la base : `docker compose stop` (dans `garage-api`). Les données sont gardées.
- **Repartir de données neuves** (par exemple après avoir changé le mot de passe de `nouveau` ou supprimé des
  données) : dans `garage-api`,
  ```bash
  docker compose down -v
  docker compose up -d
  ```
  puis relancer l'API : la base est recréée avec le jeu de démonstration.

## 7. Informations utiles

**Adresses**

| Adresse | Contenu |
| --- | --- |
| <http://localhost:4200> | L'application (front) |
| <http://localhost:8080/api/contexte> | Réponse de l'API sans connexion : utile pour vérifier que le back tourne |
| `localhost:5432`, base `garages`, utilisateur `garages`, mot de passe `garages` | La base PostgreSQL, pour un client SQL (pgAdmin, DBeaver, l'onglet Database d'IntelliJ) |

**E-mails en développement** : rien n'est envoyé. Le contenu des e-mails (lien « Mot de passe oublié », avis de loyer,
relances, message libre) s'affiche dans le terminal de l'API. Pour le mot de passe oublié, copier le lien affiché dans
le navigateur.

**Langue** : boutons FR / EN en haut à droite de l'application ; le choix est gardé par le navigateur.

**Écrans tablette et smartphone** : l'interface s'adapte à la largeur de la fenêtre (smartphone jusqu'à 640 px,
tablette jusqu'à 1024 px). Pour essayer, réduire la fenêtre ou utiliser le mode « appareil » des outils de
développement du navigateur (F12). Certains écrans de Configuration sont masqués sur smartphone (réglage dans
Configuration > Droits d'accès > Accès selon l'appareil).

**Depuis IntelliJ IDEA** (facultatif) :
- Back : ouvrir le dossier `garage-api` ; lancer la classe `GarageApiApplication` avec le profil actif `dev`
  (configuration d'exécution > *Active profiles* : `dev`). La base Docker doit être démarrée.
- Front : ouvrir le dossier `garage-web`, puis lancer le script npm `start` (fenêtre *npm* ou clic droit sur
  `package.json`).

**Journal de la base** : `docker compose logs -f postgres` (dans `garage-api`).

## 8. Lancer les tests

- Back (Docker doit tourner : les tests démarrent leur propre PostgreSQL) : `./mvnw test` dans `garage-api`.
- Front : `npm test` dans `garage-web`.

## 9. En cas de problème

| Symptôme | Cause probable | Solution |
| --- | --- | --- |
| `docker compose up -d` échoue, « Cannot connect to the Docker daemon » | Docker Desktop n'est pas démarré | Lancer Docker Desktop, attendre qu'il soit prêt, recommencer |
| L'API s'arrête avec une erreur de port 5432 ou de connexion à la base | Un autre PostgreSQL occupe le port 5432, ou la base n'est pas démarrée | Arrêter l'autre PostgreSQL, ou lancer `docker compose up -d` |
| L'API refuse de démarrer, « release version 25 not supported » | Mauvaise version de Java | Installer le JDK 25 et vérifier `java -version` |
| `./mvnw: Permission denied` (macOS, Linux) | Le lanceur n'est pas exécutable | `chmod +x mvnw` |
| Port 8080 ou 4200 déjà utilisé | Une autre application l'occupe | La fermer, ou arrêter l'ancienne instance de l'API ou du front |
| La page de connexion s'affiche mais la connexion échoue (« Impossible de joindre le serveur. » ou « Une erreur est survenue. ») | Le back n'est pas lancé, ou pas encore prêt | Lancer l'API (étape 3) et attendre `Started GarageApiApplication` |
| Une page « Site en maintenance » s'affiche | Un Admin a mis le site en maintenance (Configuration > Maintenance) | Se connecter avec `admin` et réactiver le site, ou repartir de données neuves (étape 6) |
| `npm install` échoue sur la version de Node | Node trop ancien | Installer une version du tableau de l'étape 1 |
| L'API démarre mais une erreur Liquibase parle de « checksum » ou de table existante | Base créée par une ancienne version de l'application | Recommencer à zéro (étape 6) |

## Hors développement

En dehors du profil `dev`, l'API exige un secret de connexion et crée le premier administrateur à partir de variables
d'environnement (`JWT_SECRET`, `ADMIN_LOGIN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PRENOM`, `ADMIN_NOM`) ; l'envoi des
e-mails demande un serveur SMTP (`SPRING_MAIL_HOST`). Le détail est dans le `README.md` de garage-api.
