# Stage 1: Dépendances
FROM node:20-alpine AS deps

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm install && \
    npm cache clean --force

# Stage 2: Build pour la production
FROM node:20-alpine AS builder

WORKDIR /app

# Copie des dépendances
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Copie du code source et des fichiers de configuration
COPY . .

# Build de l'application Angular pour la production
RUN npm run build -- --configuration=production

# Stage 3: Serveur de production
FROM nginx:alpine AS production

# Copier les fichiers de build
COPY --from=builder /app/dist/air-fle-front/browser/ /usr/share/nginx/html

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port 80
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"] 

# Stage 4: Développement avec hot reload
FROM node:20-alpine AS dev

WORKDIR /app

# Copie des dépendances
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Copie du code source (sera monté en volume)
COPY . .

# Exposition du port 4200 pour Angular
EXPOSE 4200

# Commande de développement avec hot reload et proxy Docker
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--port", "4200", "--proxy-config", "proxy.docker.conf.json"] 