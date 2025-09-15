# Configuration SSH pour le déploiement GitHub Actions

## 1. Sur le VPS - Créer la paire de clés SSH

Connecte-toi à ton VPS et exécute :

```bash
# Créer une paire de clés SSH dédiée pour GitHub Actions
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# Ou si ed25519 n'est pas supporté :
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
```

**Important** : Ne mets PAS de passphrase (laisse vide) sinon GitHub Actions ne pourra pas l'utiliser.

## 2. Sur le VPS - Autoriser cette clé

```bash
# Ajouter la clé publique aux clés autorisées
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys

# Vérifier les permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/github_actions_deploy
```

## 3. Sur le VPS - Récupérer la clé privée

```bash
# Afficher la clé privée (à copier pour GitHub)
cat ~/.ssh/github_actions_deploy
```

Copie TOUT le contenu, incluant :
- `-----BEGIN OPENSSH PRIVATE KEY-----`
- Le contenu encodé
- `-----END OPENSSH PRIVATE KEY-----`

## 4. Sur GitHub - Ajouter les secrets

Va sur ton repo GitHub :
1. Settings → Secrets and variables → Actions
2. Clique sur "New repository secret"
3. Ajoute ces secrets :

### SSH_PRIVATE_KEY
```
Colle ici la clé privée complète que tu as copiée
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

### SSH_USER
```
root
```
(ou ton utilisateur sur le VPS)

### SSH_HOST
```
46.62.162.199
```
(l'IP de ton VPS)

### DATABASE_URL
```
postgresql://postgres:postgres@postgres-prod:5432/airfle?schema=public
```

### JWT_SECRET
```
un-secret-tres-securise-change-le-stp
```

### ADMIN_EMAIL
```
m.brocquet@asso-air.org
```

### ADMIN_PASSWORD
```
UnMotDePasseTresSecurise123!
```

### TEACHER_EMAIL
```
l.decriem@asso-air.org
```

### TEACHER_PASSWORD
```
UnAutreMotDePasseSecurise456!
```

## 5. Sur le VPS - Préparer le dossier de déploiement

```bash
# Créer le dossier pour l'application
sudo mkdir -p /opt/air-fle
sudo chown $USER:$USER /opt/air-fle
cd /opt/air-fle

# Copier les fichiers nécessaires
# Tu peux les copier manuellement ou cloner le repo
git clone https://github.com/ton-user/air-fle.git .

# Ou juste copier les fichiers Docker nécessaires
scp docker-compose.prod.yml nginx.conf user@vps:/opt/air-fle/
```

## 6. Tester la connexion SSH

Depuis ton ordinateur local :

```bash
# Sauvegarder la clé privée localement pour tester
echo "COLLE_LA_CLE_PRIVEE_ICI" > ~/.ssh/test_github_deploy
chmod 600 ~/.ssh/test_github_deploy

# Tester la connexion
ssh -i ~/.ssh/test_github_deploy user@46.62.162.199 "echo 'Connexion OK'"

# Supprimer la clé de test après
rm ~/.ssh/test_github_deploy
```

## 7. Structure sur le VPS

Le VPS devrait avoir cette structure :
```
/opt/air-fle/
├── docker-compose.prod.yml
├── nginx.conf
├── .env.production (optionnel, les secrets viennent de GitHub)
└── scripts/
    └── seed.js (sera copié par GitHub Actions)
```

## 8. Tester le déploiement

1. Fais un petit changement dans ton code
2. Commit et push sur la branche `main`
3. Va dans l'onglet "Actions" de ton repo GitHub
4. Regarde le workflow s'exécuter

## Troubleshooting

Si la connexion SSH échoue :

1. **Vérifier le fichier sshd_config sur le VPS** :
```bash
sudo nano /etc/ssh/sshd_config

# Vérifier que ces options sont activées :
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# Redémarrer SSH si modifié :
sudo systemctl restart sshd
```

2. **Vérifier les logs SSH** :
```bash
sudo tail -f /var/log/auth.log
```

3. **Tester avec verbose** :
```bash
ssh -vvv -i ~/.ssh/github_actions_deploy user@46.62.162.199
```

## Sécurité

Pour plus de sécurité, tu peux :

1. **Créer un utilisateur dédié** pour les déploiements :
```bash
sudo adduser github-deploy
sudo usermod -aG docker github-deploy
sudo su - github-deploy
# Puis refaire les étapes de création de clés
```

2. **Limiter les commandes SSH** dans `authorized_keys` :
```bash
command="/opt/air-fle/deploy.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding ssh-ed25519 AAAAC3...
```

3. **Utiliser un firewall** :
```bash
sudo ufw allow from github.com to any port 22
```