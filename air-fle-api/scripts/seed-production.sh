#!/bin/bash

# =============================================================================
# SCRIPT DE SEED POUR LA PRODUCTION AIR-FLE
# =============================================================================

set -e  # Arrêter en cas d'erreur

echo "🚀 Initialisation de la base de données Air-FLE pour la PRODUCTION"
echo ""

# Vérifications pré-requis
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERREUR: La variable DATABASE_URL n'est pas définie"
  echo "Exemple: DATABASE_URL='postgresql://user:password@localhost:5432/airfle_prod'"
  exit 1
fi

# Demander les informations admin si non définies
if [ -z "$ADMIN_EMAIL" ]; then
  read -p "📧 Email de l'administrateur (admin@votre-domaine.com): " ADMIN_EMAIL
  export ADMIN_EMAIL
fi

if [ -z "$ADMIN_PASSWORD" ]; then
  echo "🔒 Mot de passe administrateur (sécurisé, min 8 caractères)"
  read -s -p "Mot de passe: " ADMIN_PASSWORD
  echo ""
  export ADMIN_PASSWORD
fi

if [ -z "$TEACHER_EMAIL" ]; then
  read -p "📧 Email du formateur (teacher@votre-domaine.com): " TEACHER_EMAIL
  export TEACHER_EMAIL
fi

if [ -z "$TEACHER_PASSWORD" ]; then
  echo "🔒 Mot de passe formateur (sécurisé, min 8 caractères)"
  read -s -p "Mot de passe: " TEACHER_PASSWORD
  echo ""
  export TEACHER_PASSWORD
fi

echo ""
echo "📋 Configuration:"
echo "   - Environnement: PRODUCTION"
echo "   - Admin: $ADMIN_EMAIL"
echo "   - Teacher: $TEACHER_EMAIL"
echo ""

# Confirmation
read -p "🚨 Êtes-vous sûr de vouloir initialiser la base de données de PRODUCTION ? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Opération annulée"
  exit 1
fi

echo ""
echo "🌱 Lancement du seed en mode production..."

# Variables d'environnement pour le script
export NODE_ENV=production

# Exécuter le seed
npm run seed

echo ""
echo "✅ Base de données Air-FLE initialisée avec succès !"
echo ""
echo "🚨 IMPORTANT: Connectez-vous immédiatement et changez les mots de passe !"
echo "📧 Admin: $ADMIN_EMAIL"
echo "📧 Teacher: $TEACHER_EMAIL"
echo ""
echo "🔐 Recommandations sécurité:"
echo "   - Activez l'authentification 2FA si disponible"
echo "   - Utilisez des mots de passe uniques et forts"
echo "   - Surveillez les logs de connexion"
echo ""