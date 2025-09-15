# 🚀 CI/CD Pipeline - Air-FLE

## 📋 Vue d'ensemble

Ce dossier contient la configuration complète de la CI/CD pour le projet Air-FLE avec GitHub Actions.

## 🔄 Workflows

### 1. CI/CD Principal (`ci-cd.yml`)
**Déclenché sur :** Push sur `main`/`develop` et Pull Requests

**Étapes :**
- 🔍 **Détection des changements** - Optimise les builds en ne testant que les parties modifiées
- 🧪 **Tests API** - Tests unitaires, intégration, lint, build (avec PostgreSQL)
- 🎨 **Tests Frontend** - Tests unitaires, lint, build Angular
- 🎭 **Tests E2E** - Tests Cypress complets avec base de données
- 🐳 **Build Docker** - Construction et push des images sur `main`
- 🚀 **Déploiement automatique** - Sur `http://46.62.162.199` (production uniquement)

### 2. Validation PR (`pr-validation.yml`)
**Déclenché sur :** Pull Requests

**Fonctionnalités :**
- ✅ Validation du format des titres de PR (Conventional Commits)
- 🔍 Détection des breaking changes
- 📏 Labellisation automatique de la taille des PR
- 👥 Assignment automatique des reviewers
- 🛡️ Analyse de sécurité (CodeQL, TruffleHog)
- 📊 Tests de performance (Lighthouse)
- 💬 Commentaires automatiques avec résumé

### 3. Releases (`release.yml`)
**Déclenché sur :** Tags `v*.*.*` ou manuellement

**Processus :**
- 🏷️ Création automatique de release GitHub
- 📝 Génération de changelog
- 🐳 Build et tag des images Docker avec version
- 🚀 Déploiement en production avec sauvegarde
- 📢 Notifications de statut

## 🔐 Secrets GitHub nécessaires

### Déploiement SSH
```
SSH_PRIVATE_KEY    # Clé SSH privée pour se connecter au serveur
SSH_USER           # Nom d'utilisateur SSH (ex: deploy)
SSH_HOST           # IP du serveur (46.62.162.199)
```

### Base de données et sécurité
```
DATABASE_URL       # URL complète PostgreSQL production
JWT_SECRET         # Secret JWT pour l'authentification
```

### Comptes administrateur
```
ADMIN_EMAIL        # Email admin (m.brocquet@asso-air.org)
ADMIN_PASSWORD     # Mot de passe admin sécurisé
TEACHER_EMAIL      # Email formateur (l.decriem@asso-air.org)  
TEACHER_PASSWORD   # Mot de passe formateur sécurisé
```

## 📊 Métriques et monitoring

### Tests de performance
- **Lighthouse CI** sur les PR modifiant le frontend
- Seuils configurés pour performance, accessibilité, SEO

### Couverture de code
- **Codecov** pour l'API
- Reports automatiques sur les PR

### Sécurité
- **CodeQL** analysis pour détecter les vulnérabilités
- **TruffleHog** pour détecter les secrets exposés

## 🚀 Processus de déploiement

### Développement
1. Créer une branche depuis `develop`
2. Développer et tester localement
3. Push → Tests automatiques
4. Créer PR vers `develop` → Validation complète
5. Merge → Tests sur `develop`

### Production
1. PR de `develop` vers `main`
2. Review et validation
3. Merge → Déploiement automatique sur `http://46.62.162.199`

### Releases
1. Créer tag `v1.2.3` ou déclencher manuellement
2. Build et déploiement automatique
3. Sauvegarde base de données
4. Mise à jour avec rollback possible

## 🔧 Configuration serveur

### Structure attendue sur le serveur
```
/opt/air-fle/
├── docker-compose.prod.yml
├── nginx.conf  
└── scripts/
```

### Services Docker
- `api-prod` : API NestJS
- `frontend-prod` : Frontend Angular + Nginx
- `postgres-prod` : Base de données PostgreSQL

## 🛠️ Maintenance

### Nettoyage automatique
- Images Docker anciennes (garde les 3 dernières versions)
- Logs et caches temporaires

### Sauvegardes
- Base de données sauvegardée avant chaque release
- Stockage local sur le serveur

## 🐞 Dépannage

### Échec de déploiement
1. Vérifier les logs dans l'onglet Actions
2. Se connecter au serveur et vérifier les services
3. Rollback possible via interface GitHub

### Tests qui échouent
1. Vérifier les artefacts uploadés (screenshots Cypress)
2. Logs détaillés dans chaque job
3. Re-run possible des jobs individuels

## 📞 Support

En cas de problème avec la CI/CD :
1. Consulter les logs GitHub Actions
2. Vérifier les secrets et variables d'environnement
3. Tester les composants individuellement