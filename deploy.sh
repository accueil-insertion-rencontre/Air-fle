#!/bin/bash

# Script de déploiement Air-FLE Production
# Usage: ./deploy.sh

set -e

echo "🚀 Déploiement Air-FLE Production..."

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    log_error "Docker n'est pas installé. Veuillez installer Docker d'abord."
    exit 1
fi

# Arrêter les containers de dev s'ils existent
log_info "Arrêt des containers de développement..."
docker compose -f docker-compose.dev.yml down 2>/dev/null || true

# Build du frontend Angular
log_info "Build de l'application Angular..."
cd air-fle-front
npm run build -- --configuration=production
cd ..

# Lancer les containers de production
log_info "Lancement des containers de production..."
docker compose -f docker-compose.prod.yml up -d --build

# Attendre que les services soient prêts
log_info "Attente que les services soient prêts..."
sleep 10

# Vérifier la santé des containers
log_info "Vérification de l'état des services..."
docker compose -f docker-compose.prod.yml ps

# Exécuter les migrations Prisma
log_info "Application des migrations de base de données..."
docker exec air-fle-api-prod npx prisma migrate deploy || log_warning "Migrations déjà appliquées"

# Compiler et exécuter les seeds
log_info "Initialisation des données de référence..."
cd air-fle-api
npx tsc src/seed.ts --outDir dist --esModuleInterop --resolveJsonModule --module commonjs --target es2020
docker cp dist/seed.js air-fle-api-prod:/app/dist/
docker exec air-fle-api-prod node dist/seed.js || log_warning "Seeds déjà appliqués"
cd ..

# Afficher les URLs d'accès
echo ""
log_info "🎉 Déploiement terminé avec succès !"
echo ""
echo "📍 URLs d'accès :"
echo "   Frontend : http://localhost:8080"
echo "   API Health : http://localhost:8080/api/health"
echo ""
echo "👤 Comptes par défaut :"
echo "   Admin : m.brocquet@asso-air.org"
echo "   Enseignant : l.decriem@asso-air.org"
echo ""
log_warning "N'oubliez pas de changer les mots de passe par défaut !"
echo ""
echo "📊 Pour voir les logs :"
echo "   docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🛑 Pour arrêter l'application :"
echo "   docker compose -f docker-compose.prod.yml down"