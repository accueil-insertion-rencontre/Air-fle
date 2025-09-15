# Stage 1: Dépendances
FROM node:20-alpine AS deps

# Définir les versions des outils
ARG PRISMA_VERSION=4.16.2
ARG NODE_ENV=development

# Définir le répertoire de travail
WORKDIR /app

# Variables d'environnement
ENV NODE_ENV=${NODE_ENV}

# Copie des fichiers de dépendances (rarement modifiés)
COPY package*.json ./
COPY prisma ./prisma/

# Installation des dépendances - utiliser npm install au lieu de npm ci
# pour résoudre les problèmes de compatibilité avec le package-lock.json
RUN npm install && \
    npm cache clean --force

# Génération des fichiers Prisma pour Alpine Linux (musl)
# Nécessaire pour que Prisma fonctionne correctement dans l'environnement Alpine
RUN npx prisma generate

# Stage 2: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copie des dépendances du stage précédent
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./
COPY --from=deps /app/prisma ./prisma/

# Copie du reste des fichiers (fréquemment modifiés)
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src/

# Build de l'application
RUN npm run build

# Stage 3: Développement
FROM node:20-alpine AS dev

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Définir le répertoire de travail
WORKDIR /app

# Variables d'environnement
ENV NODE_ENV=development

# Copie des dépendances et du code compilé
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./
COPY --from=deps /app/prisma ./prisma/
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/tsconfig*.json ./
COPY --from=builder /app/nest-cli.json ./

# Copie du code source pour le développement actif
COPY --chown=nestjs:nodejs src ./src/

# Exposition du port - utile pour la documentation, même si docker-compose le configure
EXPOSE 3000

# Attribution des permissions
RUN chown -R nestjs:nodejs /app

# Passage à l'utilisateur non-root
USER nestjs

# La commande de démarrage est définie dans docker-compose.yml
# Elle exécute "npx prisma migrate deploy && npm run seed && npm run start:docker"
# Cela permet d'avoir une flexibilité maximale dans l'environnement de développement 