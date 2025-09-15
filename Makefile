# Makefile Air-FLE
# Commandes simplifiées pour le développement et la production

.PHONY: help dev prod stop clean logs shell-api shell-db build test lint

# Afficher l'aide par défaut
help:
	@echo "📚 Commandes disponibles :"
	@echo ""
	@echo "  make dev        - Lancer l'environnement de développement"
	@echo "  make prod       - Déployer en production (build + seed)"
	@echo "  make stop       - Arrêter tous les containers"
	@echo "  make clean      - Nettoyer tout (containers + volumes)"
	@echo "  make logs       - Voir les logs en temps réel"
	@echo "  make shell-api  - Ouvrir un shell dans le container API"
	@echo "  make shell-db   - Se connecter à PostgreSQL"
	@echo "  make build      - Builder les images Docker"
	@echo "  make test       - Lancer les tests"
	@echo "  make lint       - Vérifier le code"
	@echo "  make seed       - Réexécuter les seeds"

# Développement
dev:
	@echo "🚀 Lancement de l'environnement de développement..."
	docker compose -f docker-compose.dev.yml up -d
	@echo "✅ Dev accessible sur http://localhost:4200"

# Production
prod:
	@echo "🚀 Déploiement en production..."
	@bash deploy.sh

# Arrêter les containers
stop:
	@echo "🛑 Arrêt des containers..."
	docker compose -f docker-compose.dev.yml down 2>/dev/null || true
	docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# Nettoyer tout
clean: stop
	@echo "🧹 Nettoyage complet..."
	docker compose -f docker-compose.dev.yml down -v 2>/dev/null || true
	docker compose -f docker-compose.prod.yml down -v 2>/dev/null || true
	docker system prune -f

# Logs
logs:
	docker compose -f docker-compose.prod.yml logs -f

logs-dev:
	docker compose -f docker-compose.dev.yml logs -f

# Shell dans l'API
shell-api:
	docker exec -it air-fle-api-prod sh

shell-api-dev:
	docker exec -it api-dev sh

# Connexion à la DB
shell-db:
	docker exec -it air-fle-postgres-prod psql -U postgres -d airfle

shell-db-dev:
	docker exec -it postgres-dev psql -U postgres -d airfle

# Build les images
build:
	@echo "🔨 Build des images Docker..."
	docker compose -f docker-compose.prod.yml build

# Tests
test:
	@echo "🧪 Lancement des tests..."
	cd air-fle-api && npm test

# Lint
lint:
	@echo "🔍 Vérification du code..."
	cd air-fle-api && npm run lint

# Seed uniquement
seed:
	@echo "🌱 Exécution des seeds..."
	cd air-fle-api && \
	npx tsc src/seed.ts --outDir dist --esModuleInterop --resolveJsonModule --module commonjs --target es2020 && \
	docker cp dist/seed.js air-fle-api-prod:/app/dist/ && \
	docker exec air-fle-api-prod node dist/seed.js

# Backup de la base de données
backup:
	@echo "💾 Backup de la base de données..."
	@mkdir -p backups
	docker exec air-fle-postgres-prod pg_dump -U postgres airfle > backups/airfle_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup créé dans backups/"

# Restore de la base de données
restore:
	@echo "📥 Restauration de la base de données..."
	@echo "Usage: make restore FILE=backups/airfle_20240101_120000.sql"
	@test -n "$(FILE)" || (echo "❌ Spécifiez FILE=chemin/vers/backup.sql" && exit 1)
	docker exec -i air-fle-postgres-prod psql -U postgres airfle < $(FILE)
	@echo "✅ Base de données restaurée"

# Status
status:
	@echo "📊 État des services :"
	@docker compose -f docker-compose.prod.yml ps || docker compose -f docker-compose.dev.yml ps