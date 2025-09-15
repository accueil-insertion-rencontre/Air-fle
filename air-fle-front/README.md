# AIR-FLE Front

Application de gestion des apprenants pour AIR-FLE.

## Prérequis

- Node.js (v18 ou supérieur)
- npm (v9 ou supérieur)
- Angular CLI (v17 ou supérieur)

## Installation

```bash
# Cloner le dépôt
git clone <repository-url>

# Accéder au répertoire du projet
cd air-fle-front

# Installer les dépendances
npm install
```

## Développement

```bash
# Lancer le serveur de développement
npm start

# L'application sera disponible sur http://localhost:4200/
```

## Tests

```bash
# Exécuter les tests unitaires
npm test

# Exécuter les tests end-to-end
npm run e2e
```

## Construction pour la production

```bash
# Construire l'application pour la production
npm run build --prod

# Les fichiers de production seront générés dans le dossier dist/
```

## Déploiement en production

### 1. Préparation

Avant de déployer, assurez-vous que :
- Tous les console.log de débogage ont été supprimés
- Les variables d'environnement sont correctement configurées dans `src/environments/environment.ts`
- Les tests ont été exécutés avec succès

### 2. Construction

```bash
# Construire l'application pour la production
npm run build --prod
```

### 3. Déploiement sur un serveur web

#### Option 1 : Serveur Apache

1. Copier le contenu du dossier `dist/air-fle-front/browser/` vers le répertoire racine du serveur web
2. Configurer Apache pour rediriger toutes les requêtes vers index.html :

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

#### Option 2 : Serveur Nginx

1. Copier le contenu du dossier `dist/air-fle-front/browser/` vers le répertoire racine du serveur web
2. Configurer Nginx :

```nginx
server {
  listen 80;
  server_name example.com;
  root /var/www/html;
  index index.html;
  
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

#### Option 3 : Conteneur Docker

1. Créer un Dockerfile :

```Dockerfile
FROM nginx:alpine
COPY dist/air-fle-front/browser/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. Créer un fichier nginx.conf :

```nginx
server {
  listen 80;
  server_name localhost;
  root /usr/share/nginx/html;
  index index.html;
  
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

3. Construire et exécuter l'image Docker :

```bash
docker build -t air-fle-front .
docker run -p 80:80 air-fle-front
```

## Maintenance

### Mise à jour des dépendances

```bash
npm update
```

### Vérification des vulnérabilités

```bash
npm audit
```

## Structure du projet

- `src/app/core` : Services, modèles et intercepteurs
- `src/app/shared` : Composants, directives et pipes partagés
- `src/app/auth` : Composants d'authentification
- `src/app/dashboard` : Composants du tableau de bord
- `src/environments` : Configurations d'environnement

## Licence

Tous droits réservés © AIR-FLE
