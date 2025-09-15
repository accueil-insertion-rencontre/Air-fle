import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedReferenceData() {
  try {
    console.log('🌱 Création des données de référence...');

    // 1. RÔLES
    console.log('📝 Création des rôles...');
    const adminRole = await prisma.role.create({
      data: { role_name: 'admin' },
    });

    const teacherRole = await prisma.role.create({
      data: { role_name: 'teacher' },
    });

    // 2. GENRES
    console.log('👥 Création des genres...');
    const genders = [
      { gender_label: 'Homme' },
      { gender_label: 'Femme' },
      { gender_label: 'Autre' },
      { gender_label: 'Non spécifié' },
    ];

    for (const gender of genders) {
      await prisma.gender.create({
        data: gender,
      });
    }

    // 3. NIVEAUX DE FRANÇAIS
    console.log('📚 Création des niveaux de français...');
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
    ];

    for (const level of frenchLevels) {
      await prisma.frenchLevel.create({
        data: level,
      });
    }

    // 4. STATUTS
    console.log('📊 Création des statuts...');
    const statuses = [
      { status_label: 'Actif' },
      { status_label: 'Inactif' },
      { status_label: 'En attente' },
      { status_label: 'Terminé' },
    ];

    for (const status of statuses) {
      await prisma.status.create({
        data: status,
      });
    }

    // 5. FINANCEMENTS
    console.log('💰 Création des financements...');
    const financings = [
      { financing_type: 'Pôle Emploi' },
      { financing_type: 'Mission Locale' },
      { financing_type: 'Conseil Départemental' },
      { financing_type: 'Autre' },
    ];

    for (const financing of financings) {
      await prisma.financing.create({
        data: financing,
      });
    }

    // 6. ORIENTATIONS
    console.log('🎯 Création des orientations...');
    const orientations = [
      { orientation_type: 'Formation', orientation_description: 'Orientation vers une formation' },
      { orientation_type: 'Emploi', orientation_description: 'Orientation vers l\'emploi' },
      { orientation_type: 'Autre', orientation_description: 'Autre orientation' },
    ];

    for (const orientation of orientations) {
      await prisma.orientation.create({
        data: orientation,
      });
    }

    // 7. RAISONS DE SORTIE
    console.log('🚪 Création des raisons de sortie...');
    const exitReasons = [
      { exit_reason: 'Formation terminée' },
      { exit_reason: 'Emploi trouvé' },
      { exit_reason: 'Déménagement' },
      { exit_reason: 'Autre' },
    ];

    for (const reason of exitReasons) {
      await prisma.exitReason.create({
        data: reason,
      });
    }

    // 8. NATIONALITÉS
    console.log('🌍 Création des nationalités...');
    const nationalities = [
      { nationality_label: 'Française' },
      { nationality_label: 'Algérienne' },
      { nationality_label: 'Marocaine' },
      { nationality_label: 'Tunisienne' },
      { nationality_label: 'Autre' },
    ];

    for (const nationality of nationalities) {
      await prisma.nationality.create({
        data: nationality,
      });
    }

    // 9. HANDICAPS
    console.log('♿ Création des handicaps...');
    const disabilities = [
      { disability_label: 'Aucun handicap', disability_description: 'Aucun handicap déclaré' },
      { disability_label: 'Handicap moteur', disability_description: 'Handicap moteur' },
      { disability_label: 'Handicap visuel', disability_description: 'Handicap visuel' },
      { disability_label: 'Handicap auditif', disability_description: 'Handicap auditif' },
      { disability_label: 'Handicap mental', disability_description: 'Handicap mental' },
      { disability_label: 'Autre handicap', disability_description: 'Autre type de handicap' },
    ];

    for (const disability of disabilities) {
      await prisma.disability.create({
        data: disability,
      });
    }

    console.log('✅ Données de référence créées avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la création des données de référence:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedReferenceData(); 