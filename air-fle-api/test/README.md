# Tests E2E avec Vitest

Ce projet utilise Vitest pour les tests end-to-end.

## Structure des tests

- `auth.e2e-vitest.ts` : Tests d'authentification
- `app.e2e-vitest.ts` : Tests de base de l'application

## Exécution des tests

```bash
# Exécuter tous les tests E2E
npm run test:e2e

# Exécuter les tests E2E en mode watch
npm run test:e2e:watch 

# Exécuter les tests avec couverture de code
npm run test:cov
```

## Avantages de Vitest

Vitest présente plusieurs avantages par rapport à Jest :

- **Performance** : Plus rapide, surtout pour les grands projets
- **Configuration simplifiée**
- **Compatibilité native avec ESM**
- **Meilleure intégration TypeScript**
- **Mode watch amélioré**

## Tests d'authentification

Le fichier `auth.e2e-vitest.ts` comprend des tests pour :
- La connexion des utilisateurs (route `/auth/login`)
- L'inscription (route `/auth/register`)
- La gestion des rôles (route `/auth/roles`)
- La gestion des tentatives de connexion échouées
- La normalisation des emails

Ces tests couvrent les cas positifs et négatifs pour assurer une couverture complète. 