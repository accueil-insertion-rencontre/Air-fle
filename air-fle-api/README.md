# Air-FLE API

## Table des matières

- [Description](#description)
- [Technologies utilisées](#technologies-utilisées)
- [Configuration](#configuration)
  - [Variables d'environnement de développement](#variables-denvironnement-de-développement)
  - [Variables d'environnement de production](#variables-denvironnement-de-production)
  - [Génération d'un JWT Secret](#génération-dun-jwt-secret)
- [Installation](#installation)
  - [Environnement de développement](#environnement-de-développement)
  - [Environnement de production](#environnement-de-production)

API de gestion pour Air-FLE

## Description

Cette API permet la gestion des principales fonctionnalités dont Air-FLE a besoin :

- Gestion des étudiants
- Gestion des cours et des sessions
- Authentification des utilisateurs
- Suivi des absences

## Technologies utilisées

- NestJS
- PostgreSQL
- Prisma ORM
- Redis
- Docker

## Configuration

### Variables d'environnement de développement

Créer un fichier `.env.development` à la racine du projet avec :

```env
DATABASE_URL="postgresql://<username_dev>:<password_dev>@postgres-dev:5432/airfle?schema=public"
REDIS_URL="redis://redis-dev:6379"
JWT_SECRET="<votre_jwt_secret>"
JWT_EXPIRES_IN="1d"
PORT=3000
NODE_ENV=development
```

Pour l'environnement de développement, les identifiants par défaut dans `docker-compose.yml` sont :

- Username : `postgres`
- Password : `postgres`

### Variables d'environnement de production

Créer un fichier `.env.production` à la racine du projet avec :

```env
DATABASE_URL="postgresql://<username_prod>:<password_prod>@postgres-prod:5432/air_fle_prod?schema=public"
REDIS_URL="redis://redis-prod:6379"
JWT_SECRET="<votre_jwt_secret>"
JWT_EXPIRES_IN="1d"
PORT=3000
NODE_ENV=production
```

Pour l'environnement de production, configurez des identifiants sécurisés dans `docker-compose.prod.yml` :

- Remplacez `user` par un nom d'utilisateur unique
- Remplacez `password` par un mot de passe fort (minimum 12 caractères, mélange de chiffres, lettres et caractères spéciaux)

### Génération d'un JWT Secret

Pour générer un JWT secret sécurisé, vous pouvez utiliser la commande suivante :

```bash
# Génération d'un secret de 64 caractères
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copiez la sortie de cette commande et utilisez-la comme valeur pour `JWT_SECRET` dans vos fichiers d'environnement.

## Installation

### Environnement de développement

```bash
# Cloner le dépôt
git clone https://github.com/accueil-insertion-rencontre/air-fle-API.git
cd air-fle-API

# Installer les dépendances
npm install

# Lancer l'application avec Docker Compose
docker-compose up
```

L'API sera disponible à l'adresse [http://localhost:3000/api/v1](http://localhost:3000/api/v1)

La documentation Swagger est accessible à [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

### Environnement de production

```bash
# Cloner le dépôt
git clone https://github.com/accueil-insertion-rencontre/air-fle-API.git
cd air-fle-API

# Installer les dépendances
npm install

# Lancer l'application en production avec Docker Compose
docker-compose -f docker-compose.prod.yml up
```
