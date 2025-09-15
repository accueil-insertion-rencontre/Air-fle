export const jwtConstants = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '1d',
};

// Vérification de sécurité obligatoire
if (!process.env.JWT_SECRET) {
  // Utiliser STDERR sans dépendre du logger Nest (pas encore bootstrappé ici)

  console.error(
    "❌ ERREUR: JWT_SECRET n'est pas défini dans les variables d'environnement.",
  );

  console.error(
    "❌ L'application ne peut pas démarrer sans une clé JWT secrète.",
  );

  console.error(
    '❌ Créez un fichier .env à la racine du projet avec JWT_SECRET=votre_clé_secrète',
  );
  process.exit(1); // Arrête l'application si JWT_SECRET n'est pas défini
}
