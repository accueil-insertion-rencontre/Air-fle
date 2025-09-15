import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Configuration par environnement
const config = {
  adminEmail: process.env.ADMIN_EMAIL || 'm.brocquet@asso-air.org',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin123!',
  teacherEmail: process.env.TEACHER_EMAIL || 'l.decriem@asso-air.org', 
  teacherPassword: process.env.TEACHER_PASSWORD || 'Teacher123!',
  isProduction: process.env.NODE_ENV === 'production',
};

// Logger avec gestion d'environnement
const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`ℹ️  ${message}`, ...args);
  },
  success: (message: string, ...args: any[]) => {
    console.log(`✅ ${message}`, ...args);
  },
  warning: (message: string, ...args: any[]) => {
    console.log(`⚠️  ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`❌ ${message}`, ...args);
  },
};

async function checkPrerequisites() {
  try {
    // Tester la connexion DB
    await prisma.$queryRaw`SELECT 1`;
    logger.success('Connexion base de données OK');
  } catch (error) {
    logger.error('Impossible de se connecter à la base de données');
    throw error;
  }

  // Vérifier les variables d'environnement critiques
  if (config.isProduction) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL manquante en production');
    }
    if (config.adminPassword === 'Admin123!' || config.teacherPassword === 'Teacher123!') {
      logger.warning('⚠️  SÉCURITÉ: Mots de passe par défaut détectés en production!');
      logger.warning('Définissez ADMIN_PASSWORD et TEACHER_PASSWORD dans vos variables d\'environnement');
    }
  }
}

// Fonction helper pour créer des données avec feedback
async function createReferenceData<T extends Record<string, any>>(
  tableName: string,
  data: T[],
  prismaModel: any,
  uniqueField: keyof T,
  displayName: string
): Promise<void> {
  logger.info(`${displayName}...`);
  let createdCount = 0;
  
  for (const item of data) {
    const existing = await prismaModel.findFirst({
      where: { [uniqueField]: item[uniqueField] },
    });
    if (!existing) {
      await prismaModel.create({ data: item });
      createdCount++;
    }
  }
  
  logger.success(`${tableName}: ${createdCount} créés, ${data.length - createdCount} existants`);
}

async function main() {
  logger.info('🌱 Initialisation du seed Air-FLE...');
  
  if (config.isProduction) {
    logger.warning('🔒 MODE PRODUCTION DÉTECTÉ');
    logger.warning('Emails admin:', config.adminEmail);
    logger.warning('CHANGEZ LES MOTS DE PASSE APRÈS LE PREMIER DÉPLOIEMENT!');
  }

  // Vérifications préalables
  await checkPrerequisites();

  // Utiliser une transaction pour garantir la cohérence
  await prisma.$transaction(async (tx) => {
    logger.info('📋 Création des rôles système...');
    
    // Créer les rôles par défaut s'ils n'existent pas déjà
    let adminRole = await tx.role.findFirst({
      where: { role_name: 'admin' },
    });
    if (!adminRole) {
      adminRole = await tx.role.create({
        data: { role_name: 'admin' },
      });
      logger.success('Rôle admin créé');
    } else {
      logger.info('Rôle admin existe déjà');
    }

    let teacherRole = await tx.role.findFirst({
      where: { role_name: 'teacher' },
    });
    if (!teacherRole) {
      teacherRole = await tx.role.create({
        data: { role_name: 'teacher' },
      });
      logger.success('Rôle teacher créé');
    } else {
      logger.info('Rôle teacher existe déjà');
    }

    return { adminRole, teacherRole };
  });

  logger.success('✅ Rôles système configurés');

  // === DONNÉES DE RÉFÉRENCE ===
  logger.info('📚 Création des données de référence...');

  // 1. GENRES
  logger.info('👥 Traitement des genres...');
  const genders = [
    { gender_label: 'Homme' },
    { gender_label: 'Femme' },
    { gender_label: 'Autre' },
    { gender_label: 'Non spécifié' },
  ];

  let genderCount = 0;
  for (const gender of genders) {
    const existingGender = await prisma.gender.findFirst({
      where: { gender_label: gender.gender_label },
    });
    if (!existingGender) {
      await prisma.gender.create({
        data: gender,
      });
      genderCount++;
    }
  }
  logger.success(`Genres: ${genderCount} créés, ${genders.length - genderCount} existants`);

  // 2. NIVEAUX DE FRANÇAIS (CECR)
  const frenchLevels = [
    { french_level_code: 'A0', french_level_description: 'Débutant absolu - Aucune connaissance' },
    { french_level_code: 'A1', french_level_description: 'Utilisateur élémentaire - Niveau découverte' },
    { french_level_code: 'A1+', french_level_description: 'Utilisateur élémentaire - A1 renforcé' },
    { french_level_code: 'A2', french_level_description: 'Utilisateur élémentaire - Niveau de survie' },
    { french_level_code: 'A2+', french_level_description: 'Utilisateur élémentaire - A2 renforcé' },
    { french_level_code: 'B1', french_level_description: 'Utilisateur indépendant - Niveau seuil' },
    { french_level_code: 'B1+', french_level_description: 'Utilisateur indépendant - B1 renforcé' },
    { french_level_code: 'B2', french_level_description: 'Utilisateur indépendant - Niveau avancé' },
    { french_level_code: 'C1', french_level_description: 'Utilisateur expérimenté - Niveau autonome' },
    { french_level_code: 'C2', french_level_description: 'Utilisateur expérimenté - Niveau maîtrise' },
    { french_level_code: 'FLE-P', french_level_description: 'Français Langue Étrangère - Professionnel' },
    { french_level_code: 'Alpha', french_level_description: 'Alphabétisation' },
    { french_level_code: 'Post-Alpha', french_level_description: 'Post-Alphabétisation' },
  ];

  await createReferenceData(
    'Niveaux français',
    frenchLevels,
    prisma.frenchLevel,
    'french_level_code',
    '📚 Traitement des niveaux de français'
  );

  // 3. TYPES DE FINANCEMENT
  // console.log('💰 Création des types de financement...');
  const financings = [
    { financing_type: 'OFII' },
    { financing_type: 'OPCO' },
    { financing_type: 'CPF' },
    { financing_type: 'Pôle Emploi' },
    { financing_type: 'Région' },
    { financing_type: 'CAF' },
    { financing_type: 'Autofinancement' },
    { financing_type: 'Entreprise' },
    { financing_type: 'Mission Locale' },
    { financing_type: 'ASP' },
    { financing_type: 'CCAS' },
    { financing_type: 'Autre' },
  ];

  for (const financing of financings) {
    const existingFinancing = await prisma.financing.findFirst({
      where: { financing_type: financing.financing_type },
    });
    if (!existingFinancing) {
      await prisma.financing.create({
        data: financing,
      });
    }
  }

  // 4. HANDICAPS
  // console.log('♿ Création des types de handicaps...');
  const disabilities = [
    {
      disability_label: 'Handicap moteur',
      disability_description: 'Difficultés de déplacement, paralysies',
    },
    {
      disability_label: 'Handicap visuel',
      disability_description: 'Cécité, malvoyance',
    },
    {
      disability_label: 'Handicap auditif',
      disability_description: 'Surdité, malentendance',
    },
    {
      disability_label: 'Handicap mental',
      disability_description: 'Déficience intellectuelle',
    },
    {
      disability_label: 'Handicap psychique',
      disability_description: 'Troubles psychiatriques',
    },
    {
      disability_label: 'Trouble DYS',
      disability_description: 'Dyslexie, dyspraxie, dysorthographie',
    },
    {
      disability_label: 'Trouble autistique',
      disability_description: 'Troubles du spectre autistique',
    },
    {
      disability_label: 'Handicap cognitif',
      disability_description: 'Troubles de la mémoire, attention',
    },
    {
      disability_label: 'Maladie invalidante',
      disability_description: 'Maladies chroniques invalidantes',
    },
    {
      disability_label: 'Polyhandicap',
      disability_description: 'Association de plusieurs handicaps',
    },
    {
      disability_label: 'Autre',
      disability_description: 'Autre type de handicap non listé',
    },
  ];

  for (const disability of disabilities) {
    const existingDisability = await prisma.disability.findFirst({
      where: { disability_label: disability.disability_label },
    });
    if (!existingDisability) {
      await prisma.disability.create({
        data: disability,
      });
    }
  }

  // 5. STATUTS ADMINISTRATIFS
  // console.log('📋 Création des statuts...');
  const statuses = [
    { status_label: 'Actif' },
    { status_label: 'En attente' },
    { status_label: 'Suspendu' },
    { status_label: 'Diplômé' },
    { status_label: 'Abandon' },
    { status_label: 'Exclus' },
    { status_label: 'Transféré' },
    { status_label: 'Congé maladie' },
    { status_label: 'Congé maternité' },
  ];

  for (const status of statuses) {
    const existingStatus = await prisma.status.findFirst({
      where: { status_label: status.status_label },
    });
    if (!existingStatus) {
      await prisma.status.create({
        data: status,
      });
    }
  }

  // 6. ORIENTATIONS
  // console.log('🎯 Création des orientations...');
  const orientations = [
    {
      orientation_type: 'Emploi direct',
      orientation_description: "Orientation vers l'emploi",
    },
    {
      orientation_type: 'Formation professionnelle',
      orientation_description: 'Poursuite en formation pro',
    },
    {
      orientation_type: 'Formation générale',
      orientation_description: 'Poursuite études générales',
    },
    {
      orientation_type: "Création d'entreprise",
      orientation_description: 'Projet entrepreneurial',
    },
    {
      orientation_type: 'Remise à niveau',
      orientation_description: 'Consolidation des acquis',
    },
    {
      orientation_type: 'Spécialisation',
      orientation_description: 'Formation spécialisée',
    },
    {
      orientation_type: 'VAE',
      orientation_description: "Validation des Acquis de l'Expérience",
    },
    {
      orientation_type: 'Autre formation',
      orientation_description: 'Autre type de formation',
    },
    {
      orientation_type: 'Arrêt temporaire',
      orientation_description: 'Pause dans le parcours',
    },
    {
      orientation_type: 'Non définie',
      orientation_description: 'Orientation non encore définie',
    },
  ];

  for (const orientation of orientations) {
    const existingOrientation = await prisma.orientation.findFirst({
      where: { orientation_type: orientation.orientation_type },
    });
    if (!existingOrientation) {
      await prisma.orientation.create({
        data: orientation,
      });
    }
  }

  // 7. RAISONS DE SORTIE
  // console.log('🚪 Création des raisons de sortie...');
  const exitReasons = [
    { exit_reason: 'Fin de formation' },
    { exit_reason: 'Emploi trouvé' },
    { exit_reason: 'Déménagement' },
    { exit_reason: 'Problème personnel' },
    { exit_reason: 'Problème de santé' },
    { exit_reason: 'Problème financier' },
    { exit_reason: 'Inadéquation formation' },
    { exit_reason: 'Exclusion' },
    { exit_reason: 'Abandon personnel' },
    { exit_reason: 'Autre formation' },
    { exit_reason: 'Retour au pays' },
    { exit_reason: 'Non assiduité' },
  ];

  for (const exitReason of exitReasons) {
    const existingExitReason = await prisma.exitReason.findFirst({
      where: { exit_reason: exitReason.exit_reason },
    });
    if (!existingExitReason) {
      await prisma.exitReason.create({
        data: exitReason,
      });
    }
  }

  // 8. NATIONALITÉS (Liste complète des pays)
  // console.log('🌍 Création des nationalités...');
  const nationalities = [
    { nationality_label: 'Afghanistan' },
    { nationality_label: 'Afrique du Sud' },
    { nationality_label: 'Albanie' },
    { nationality_label: 'Algérie' },
    { nationality_label: 'Allemagne' },
    { nationality_label: 'Andorre' },
    { nationality_label: 'Angola' },
    { nationality_label: 'Antigua-et-Barbuda' },
    { nationality_label: 'Arabie Saoudite' },
    { nationality_label: 'Argentine' },
    { nationality_label: 'Arménie' },
    { nationality_label: 'Australie' },
    { nationality_label: 'Autriche' },
    { nationality_label: 'Azerbaïdjan' },
    { nationality_label: 'Bahamas' },
    { nationality_label: 'Bahreïn' },
    { nationality_label: 'Bangladesh' },
    { nationality_label: 'Barbade' },
    { nationality_label: 'Belgique' },
    { nationality_label: 'Belize' },
    { nationality_label: 'Bénin' },
    { nationality_label: 'Bhoutan' },
    { nationality_label: 'Biélorussie' },
    { nationality_label: 'Birmanie (Myanmar)' },
    { nationality_label: 'Bolivie' },
    { nationality_label: 'Bosnie-Herzégovine' },
    { nationality_label: 'Botswana' },
    { nationality_label: 'Brésil' },
    { nationality_label: 'Brunei' },
    { nationality_label: 'Bulgarie' },
    { nationality_label: 'Burkina Faso' },
    { nationality_label: 'Burundi' },
    { nationality_label: 'Cambodge' },
    { nationality_label: 'Cameroun' },
    { nationality_label: 'Canada' },
    { nationality_label: 'Cap-Vert' },
    { nationality_label: 'Centrafrique' },
    { nationality_label: 'Chili' },
    { nationality_label: 'Chine' },
    { nationality_label: 'Chypre' },
    { nationality_label: 'Colombie' },
    { nationality_label: 'Comores' },
    { nationality_label: 'Congo' },
    { nationality_label: 'Congo (RDC)' },
    { nationality_label: 'Corée du Nord' },
    { nationality_label: 'Corée du Sud' },
    { nationality_label: 'Costa Rica' },
    { nationality_label: "Côte d'Ivoire" },
    { nationality_label: 'Croatie' },
    { nationality_label: 'Cuba' },
    { nationality_label: 'Danemark' },
    { nationality_label: 'Djibouti' },
    { nationality_label: 'Dominique' },
    { nationality_label: 'Égypte' },
    { nationality_label: 'Émirats Arabes Unis' },
    { nationality_label: 'Équateur' },
    { nationality_label: 'Érythrée' },
    { nationality_label: 'Espagne' },
    { nationality_label: 'Estonie' },
    { nationality_label: 'Eswatini' },
    { nationality_label: 'États-Unis' },
    { nationality_label: 'Éthiopie' },
    { nationality_label: 'Fidji' },
    { nationality_label: 'Finlande' },
    { nationality_label: 'France' },
    { nationality_label: 'Gabon' },
    { nationality_label: 'Gambie' },
    { nationality_label: 'Géorgie' },
    { nationality_label: 'Ghana' },
    { nationality_label: 'Grèce' },
    { nationality_label: 'Grenade' },
    { nationality_label: 'Guatemala' },
    { nationality_label: 'Guinée' },
    { nationality_label: 'Guinée-Bissau' },
    { nationality_label: 'Guinée équatoriale' },
    { nationality_label: 'Guyana' },
    { nationality_label: 'Haïti' },
    { nationality_label: 'Honduras' },
    { nationality_label: 'Hongrie' },
    { nationality_label: 'Îles Cook' },
    { nationality_label: 'Îles Marshall' },
    { nationality_label: 'Îles Salomon' },
    { nationality_label: 'Inde' },
    { nationality_label: 'Indonésie' },
    { nationality_label: 'Irak' },
    { nationality_label: 'Iran' },
    { nationality_label: 'Irlande' },
    { nationality_label: 'Islande' },
    { nationality_label: 'Israël' },
    { nationality_label: 'Italie' },
    { nationality_label: 'Jamaïque' },
    { nationality_label: 'Japon' },
    { nationality_label: 'Jordanie' },
    { nationality_label: 'Kazakhstan' },
    { nationality_label: 'Kenya' },
    { nationality_label: 'Kirghizistan' },
    { nationality_label: 'Kiribati' },
    { nationality_label: 'Koweït' },
    { nationality_label: 'Laos' },
    { nationality_label: 'Lesotho' },
    { nationality_label: 'Lettonie' },
    { nationality_label: 'Liban' },
    { nationality_label: 'Liberia' },
    { nationality_label: 'Libye' },
    { nationality_label: 'Liechtenstein' },
    { nationality_label: 'Lituanie' },
    { nationality_label: 'Luxembourg' },
    { nationality_label: 'Macédoine du Nord' },
    { nationality_label: 'Madagascar' },
    { nationality_label: 'Malaisie' },
    { nationality_label: 'Malawi' },
    { nationality_label: 'Maldives' },
    { nationality_label: 'Mali' },
    { nationality_label: 'Malte' },
    { nationality_label: 'Maroc' },
    { nationality_label: 'Maurice' },
    { nationality_label: 'Mauritanie' },
    { nationality_label: 'Mexique' },
    { nationality_label: 'Micronésie' },
    { nationality_label: 'Moldavie' },
    { nationality_label: 'Monaco' },
    { nationality_label: 'Mongolie' },
    { nationality_label: 'Monténégro' },
    { nationality_label: 'Mozambique' },
    { nationality_label: 'Namibie' },
    { nationality_label: 'Nauru' },
    { nationality_label: 'Népal' },
    { nationality_label: 'Nicaragua' },
    { nationality_label: 'Niger' },
    { nationality_label: 'Nigeria' },
    { nationality_label: 'Niue' },
    { nationality_label: 'Norvège' },
    { nationality_label: 'Nouvelle-Zélande' },
    { nationality_label: 'Oman' },
    { nationality_label: 'Ouganda' },
    { nationality_label: 'Ouzbékistan' },
    { nationality_label: 'Pakistan' },
    { nationality_label: 'Palaos' },
    { nationality_label: 'Palestine' },
    { nationality_label: 'Panama' },
    { nationality_label: 'Papouasie-Nouvelle-Guinée' },
    { nationality_label: 'Paraguay' },
    { nationality_label: 'Pays-Bas' },
    { nationality_label: 'Pérou' },
    { nationality_label: 'Philippines' },
    { nationality_label: 'Pologne' },
    { nationality_label: 'Portugal' },
    { nationality_label: 'Qatar' },
    { nationality_label: 'République dominicaine' },
    { nationality_label: 'République tchèque' },
    { nationality_label: 'Roumanie' },
    { nationality_label: 'Royaume-Uni' },
    { nationality_label: 'Russie' },
    { nationality_label: 'Rwanda' },
    { nationality_label: 'Saint-Christophe-et-Niévès' },
    { nationality_label: 'Saint-Marin' },
    { nationality_label: 'Saint-Vincent-et-les-Grenadines' },
    { nationality_label: 'Sainte-Lucie' },
    { nationality_label: 'Salvador' },
    { nationality_label: 'Samoa' },
    { nationality_label: 'São Tomé-et-Principe' },
    { nationality_label: 'Sénégal' },
    { nationality_label: 'Serbie' },
    { nationality_label: 'Seychelles' },
    { nationality_label: 'Sierra Leone' },
    { nationality_label: 'Singapour' },
    { nationality_label: 'Slovaquie' },
    { nationality_label: 'Slovénie' },
    { nationality_label: 'Somalie' },
    { nationality_label: 'Soudan' },
    { nationality_label: 'Soudan du Sud' },
    { nationality_label: 'Sri Lanka' },
    { nationality_label: 'Suède' },
    { nationality_label: 'Suisse' },
    { nationality_label: 'Suriname' },
    { nationality_label: 'Syrie' },
    { nationality_label: 'Tadjikistan' },
    { nationality_label: 'Tanzanie' },
    { nationality_label: 'Tchad' },
    { nationality_label: 'Thaïlande' },
    { nationality_label: 'Timor oriental' },
    { nationality_label: 'Togo' },
    { nationality_label: 'Tonga' },
    { nationality_label: 'Trinité-et-Tobago' },
    { nationality_label: 'Tunisie' },
    { nationality_label: 'Turkménistan' },
    { nationality_label: 'Turquie' },
    { nationality_label: 'Tuvalu' },
    { nationality_label: 'Ukraine' },
    { nationality_label: 'Uruguay' },
    { nationality_label: 'Vanuatu' },
    { nationality_label: 'Vatican' },
    { nationality_label: 'Venezuela' },
    { nationality_label: 'Vietnam' },
    { nationality_label: 'Yémen' },
    { nationality_label: 'Zambie' },
    { nationality_label: 'Zimbabwe' },
    { nationality_label: 'Apatride' },
    { nationality_label: 'Non spécifiée' },
  ];

  // Création par batch pour optimiser les performances
  const batchSize = 50;
  for (let i = 0; i < nationalities.length; i += batchSize) {
    const batch = nationalities.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (nationality) => {
        const existingNationality = await prisma.nationality.findFirst({
          where: { nationality_label: nationality.nationality_label },
        });
        if (!existingNationality) {
          await prisma.nationality.create({
            data: nationality,
          });
        }
      }),
    );
  }

  // console.log('✅ Toutes les données de référence ont été créées !');

  // === UTILISATEURS PAR DÉFAUT ===
  logger.info('👥 Création des utilisateurs par défaut...');

  // Récupérer les rôles pour les utilisateurs
  const roles = await prisma.role.findMany();
  const adminRole = roles.find(r => r.role_name === 'admin');
  const teacherRole = roles.find(r => r.role_name === 'teacher');

  if (!adminRole || !teacherRole) {
    throw new Error('Rôles admin/teacher non trouvés. Problème avec la création des rôles.');
  }

  // Créer un utilisateur admin par défaut
  const hashedAdminPassword = await argon2.hash(config.adminPassword);
  const adminUser = await prisma.user.upsert({
    where: { user_mail: config.adminEmail },
    update: {
      user_password: hashedAdminPassword,
    },
    create: {
      user_firstname: 'Admin',
      user_lastname: 'System',
      user_mail: config.adminEmail,
      user_password: hashedAdminPassword,
      role: {
        connect: {
          role_uuid: adminRole.role_uuid,
        },
      },
    },
  });
  logger.success(`Utilisateur admin configuré: ${adminUser.user_mail}`);

  // Créer un utilisateur enseignant par défaut
  const hashedTeacherPassword = await argon2.hash(config.teacherPassword);
  const teacherUser = await prisma.user.upsert({
    where: { user_mail: config.teacherEmail },
    update: {
      user_password: hashedTeacherPassword,
    },
    create: {
      user_firstname: 'Teacher',
      user_lastname: 'User',
      user_mail: config.teacherEmail,
      user_password: hashedTeacherPassword,
      role: {
        connect: {
          role_uuid: teacherRole.role_uuid,
        },
      },
    },
  });
  logger.success(`Utilisateur enseignant configuré: ${teacherUser.user_mail}`);

  // RÉSUMÉ FINAL
  logger.success('🎉 SEED TERMINÉ AVEC SUCCÈS !');
  
  // Compter les données créées pour le rapport
  const counts = await Promise.all([
    prisma.role.count(),
    prisma.gender.count(),
    prisma.frenchLevel.count(),
    prisma.financing.count(),
    prisma.disability.count(),
    prisma.status.count(),
    prisma.orientation.count(),
    prisma.exitReason.count(),
    prisma.nationality.count(),
    prisma.user.count(),
  ]);

  logger.info('📊 RÉSUMÉ DES DONNÉES CRÉÉES :');
  logger.info(`   - Rôles: ${counts[0]}`);
  logger.info(`   - Genres: ${counts[1]}`);
  logger.info(`   - Niveaux de français: ${counts[2]}`);
  logger.info(`   - Types de financement: ${counts[3]}`);
  logger.info(`   - Handicaps: ${counts[4]}`);
  logger.info(`   - Statuts: ${counts[5]}`);
  logger.info(`   - Orientations: ${counts[6]}`);
  logger.info(`   - Raisons de sortie: ${counts[7]}`);
  logger.info(`   - Nationalités: ${counts[8]}`);
  logger.info(`   - Utilisateurs: ${counts[9]}`);
  
  if (config.isProduction) {
    logger.warning('🚨 IMPORTANT: Changez les mots de passe dès la première connexion !');
    logger.warning('🔒 Utilisez des mots de passe forts et uniques pour chaque environnement.');
  }
  
  logger.success('✅ Base de données Air-FLE initialisée et prête pour la production !');
}

main()
  .catch((e) => {
    logger.error('💥 ERREUR CRITIQUE LORS DU SEED');
    logger.error('Détails de l\'erreur:', e);
    
    if (e.code === 'P1001') {
      logger.error('❌ Impossible de se connecter à la base de données');
      logger.error('Vérifiez que PostgreSQL est démarré et accessible');
      logger.error('Vérifiez la variable DATABASE_URL');
    } else if (e.code?.startsWith('P2')) {
      logger.error('❌ Erreur de contrainte de base de données');
      logger.error('Il y a peut-être des données corrompues ou des contraintes non respectées');
    }
    
    logger.error('🔧 Actions suggérées:');
    logger.error('1. Vérifiez la connexion à la base de données');
    logger.error('2. Vérifiez que les migrations Prisma ont été appliquées');
    logger.error('3. Si nécessaire, videz la base et relancez les migrations');
    
    process.exit(1);
  })
  .finally(async () => {
    logger.info('🔌 Fermeture de la connexion Prisma...');
    await prisma.$disconnect();
  });
