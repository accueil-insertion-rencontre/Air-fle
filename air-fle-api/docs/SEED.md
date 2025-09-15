# 🌱 Guide d'utilisation des Seeds Air-FLE

## 📋 Vue d'ensemble

Le système de seed Air-FLE initialise automatiquement votre base de données avec toutes les données de référence nécessaires et les comptes utilisateurs par défaut.

## 🚀 Utilisation

### Développement Local
```bash
# Seed simple (recommandé pour le développement)
npm run seed

# Seed de données de référence seulement
npm run seed:reference-data
```

### Production
```bash
# Script interactif avec vérifications de sécurité
./scripts/seed-production.sh

# Ou avec variables d'environnement prédéfinies
ADMIN_EMAIL=admin@votreDomaine.com \
ADMIN_PASSWORD=VotreMotDePasseSecurise \
TEACHER_EMAIL=formateur@votreDomaine.com \
TEACHER_PASSWORD=AutreMotDePasseSecurise \
NODE_ENV=production \
npm run seed
```

## 📊 Données créées

### Données de référence
- **Rôles** : admin, teacher
- **Genres** : Homme, Femme, Autre, Non spécifié
- **Niveaux de français** : A0 à C2, Alpha, Post-Alpha, FLE-P (13 niveaux)
- **Financements** : OFII, OPCO, CPF, Pôle Emploi, etc. (12 types)
- **Handicaps** : Liste complète des handicaps reconnus (11 types)
- **Statuts** : Actif, En attente, Suspendu, etc. (9 statuts)
- **Orientations** : Emploi, Formation, VAE, etc. (10 orientations)
- **Raisons de sortie** : Fin formation, Emploi trouvé, etc. (12 raisons)
- **Nationalités** : **TOUTES les nationalités du monde** (198 pays)

### Utilisateurs par défaut
- **Administrateur** : Email configurable (défaut: admin@airfle.com)
- **Formateur** : Email configurable (défaut: teacher@airfle.com)

## 🔧 Configuration

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `NODE_ENV` | Environnement d'exécution | `development` |
| `DATABASE_URL` | URL de connexion PostgreSQL | *requis* |
| `ADMIN_EMAIL` | Email de l'administrateur | `admin@airfle.com` |
| `ADMIN_PASSWORD` | Mot de passe administrateur | `Admin123!` |
| `TEACHER_EMAIL` | Email du formateur | `teacher@airfle.com` |
| `TEACHER_PASSWORD` | Mot de passe formateur | `Teacher123!` |

### Exemple .env.production
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/airfle_prod"
ADMIN_EMAIL="admin@votre-ecole.fr"
ADMIN_PASSWORD="MotDePasseTresSecurise123!"
TEACHER_EMAIL="formateur@votre-ecole.fr" 
TEACHER_PASSWORD="AutreMotDePasseSecurise456!"
```

## 🛡️ Sécurité

### ⚠️ IMPORTANT - Production
1. **Changez IMMÉDIATEMENT** les mots de passe après le premier déploiement
2. **N'utilisez JAMAIS** les mots de passe par défaut en production
3. **Définissez** des variables d'environnement sécurisées
4. **Surveillez** les logs de connexion

### Bonnes pratiques
- Mots de passe minimum 12 caractères
- Combinaison lettres, chiffres, symboles
- Mots de passe uniques par environnement
- Rotation régulière des mots de passe

## 🔍 Dépannage

### Erreurs courantes

#### "Impossible de se connecter à la base de données"
```bash
# Vérifiez PostgreSQL
sudo systemctl status postgresql

# Vérifiez la variable DATABASE_URL
echo $DATABASE_URL

# Testez la connexion
psql $DATABASE_URL -c "SELECT 1;"
```

#### "Erreur de contrainte de base de données"
```bash
# Appliquez les migrations
npx prisma migrate deploy

# Ou en cas de corruption, réinitialisez
npx prisma migrate reset
```

#### "Rôles admin/teacher non trouvés"
- Le script crée automatiquement les rôles
- Si l'erreur persiste, vérifiez les migrations Prisma

## 📝 Logs

Le seed produit des logs détaillés :
- ✅ Succès des opérations
- ⚠️ Avertissements de sécurité  
- ❌ Erreurs avec suggestions de résolution
- 📊 Résumé final avec compteurs

## 🔄 Réexécution

Le seed est **idempotent** :
- Peut être réexécuté sans danger
- Détecte les données existantes
- Met à jour les mots de passe si nécessaire
- Ne crée pas de doublons

## 📞 Support

En cas de problème :
1. Consultez les logs détaillés
2. Vérifiez la configuration de la base de données
3. Validez les variables d'environnement
4. Contactez l'équipe technique avec les logs d'erreur