import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function getOrCreate(model, where, create) {
  let record = await model.findFirst({ where });
  if (!record) {
    record = await model.create({ data: create });
  }
  return record;
}

async function main() {
  // Création des entités associées
  const frenchLevel = await getOrCreate(
    prisma.frenchLevel,
    { french_level_code: 'A2' },
    { french_level_code: 'A2', french_level_description: 'Débutant' }
  );

  const session = await getOrCreate(
    prisma.session,
    { session_label: 'Session Printemps' },
    {
      session_label: 'Session Printemps',
      session_started_at: new Date('2025-03-01'),
      session_finished_at: new Date('2025-06-30'),
    }
  );

  const group = await getOrCreate(
    prisma.group,
    { group_label: 'Groupe Alpha' },
    { group_label: 'Groupe Alpha', session_uuid: session.session_uuid }
  );

  const nationality = await getOrCreate(
    prisma.nationality,
    { nationality_label: 'Française' },
    { nationality_label: 'Française' }
  );

  const status = await getOrCreate(
    prisma.status,
    { status_label: 'Actif' },
    { status_label: 'Actif' }
  );

  const financing = await getOrCreate(
    prisma.financing,
    { financing_type: 'Pôle Emploi' },
    { financing_type: 'Pôle Emploi' }
  );

  const orientation = await getOrCreate(
    prisma.orientation,
    { orientation_type: 'Orientation 1' },
    { orientation_type: 'Orientation 1', orientation_description: 'Première orientation' }
  );

  const gender = await getOrCreate(
    prisma.gender,
    { gender_label: 'Homme' },
    { gender_label: 'Homme' }
  );

  // Listes de prénoms et noms encore plus variés
  const firstnames = [
    'Jean', 'Marie', 'Paul', 'Luc', 'Sophie', 'Claire', 'Julien', 'Camille', 'Antoine', 'Emma',
    'Louis', 'Alice', 'Hugo', 'Léa', 'Gabriel', 'Chloé', 'Lucas', 'Manon', 'Nathan', 'Sarah',
    'Mathis', 'Inès', 'Enzo', 'Lina', 'Raphaël', 'Jade', 'Ethan', 'Louna', 'Tom', 'Mila',
    'Noah', 'Léna', 'Liam', 'Anna', 'Sacha', 'Eva', 'Axel', 'Zoé', 'Maxime', 'Rose',
    'Arthur', 'Ambre', 'Adam', 'Julia', 'Maël', 'Lou', 'Aaron', 'Iris', 'Marius', 'Elise',
    'Baptiste', 'Valentin', 'Théo', 'Loris', 'Oscar', 'Nolan', 'Timéo', 'Louna', 'Lison', 'Apolline',
    'Lila', 'Salomé', 'Noémie', 'Célia', 'Mya', 'Lylou', 'Livia', 'Louna', 'Maëlys', 'Lénaïc',
    'Yanis', 'Kylian', 'Matteo', 'Rayan', 'Amine', 'Ilian', 'Sami', 'Ilyes', 'Youssef', 'Nassim',
    'Aya', 'Meryem', 'Nour', 'Rania', 'Lina', 'Imane', 'Sarah', 'Maya', 'Sana', 'Amina',
    'Fatima', 'Samira', 'Leïla', 'Nadia', 'Sabrina', 'Karima', 'Siham', 'Yasmine', 'Nesrine', 'Sonia'
  ];
  const lastnames = [
    'Dupont', 'Durand', 'Lefebvre', 'Martin', 'Bernard', 'Petit', 'Robert', 'Richard', 'Moreau', 'Simon',
    'Laurent', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel', 'Fournier', 'Girard', 'Bonnet', 'Dupuis',
    'Lambert', 'Fontaine', 'Rousseau', 'Vincent', 'Muller', 'Lemoine', 'Faure', 'Andre', 'Mercier', 'Blanc',
    'Guerin', 'Boyer', 'Garnier', 'Chevalier', 'Francois', 'Legrand', 'Gauthier', 'Garcia', 'Perrin', 'Robin',
    'Clement', 'Morin', 'Nicolas', 'Henry', 'Roussel', 'Mathieu', 'Payet', 'Lucas', 'Dumont', 'Brun',
    'Marchand', 'Aubert', 'Benoit', 'Marty', 'Renard', 'Collet', 'Menard', 'Barbier', 'Millet', 'Charles',
    'Boucher', 'Picard', 'Poirier', 'Gros', 'Renaud', 'Schmitt', 'Roy', 'Lemoine', 'Jacquet', 'Paris',
    'Perrier', 'Leblanc', 'Bouvier', 'Rolland', 'Weber', 'Humbert', 'Gilbert', 'Carpentier', 'Pierre', 'Fernandez',
    'Leclerc', 'Bertin', 'Chauvet', 'Philippe', 'Bailly', 'Navarro', 'Lopez', 'Guichard', 'Masson', 'Baron',
    'Perrot', 'Colin', 'Bouchet', 'Prevost', 'Laporte', 'Renault', 'Delattre', 'Lamy', 'Delorme', 'Leger'
  ];
  // Créer plusieurs entités variées pour chaque type
  const statuses: any[] = [];
  const financings: any[] = [];
  const frenchLevels: any[] = [];
  const genders: any[] = [];
  const groupsArr: any[] = [];
  const nationalitiesArr: any[] = [];
  const orientationsArr: any[] = [];

  for (let i = 1; i <= 10; i++) {
    statuses.push(await prisma.status.create({ data: { status_label: `Statut${i}` } }) as any);
    financings.push(await prisma.financing.create({ data: { financing_type: `Financement${i}` } }) as any);
    frenchLevels.push(await prisma.frenchLevel.create({ data: { french_level_code: `A${i}`, french_level_description: `Niveau ${i}` } }) as any);
    genders.push(await prisma.gender.create({ data: { gender_label: `Genre${i}` } }) as any);
    groupsArr.push(await prisma.group.create({ data: { group_label: `Groupe${i}`, session_uuid: session.session_uuid } }) as any);
    nationalitiesArr.push(await prisma.nationality.create({ data: { nationality_label: `Nationalité${i}` } }) as any);
    orientationsArr.push(await prisma.orientation.create({ data: { orientation_type: `Orientation${i}`, orientation_description: `Desc${i}` } }) as any);
  }

  // Log des entités associées
      // console.log('session:', session);
    // console.log('group:', groupsArr[0]);
    // console.log('gender:', genders[0]);
    // console.log('frenchLevel:', frenchLevels[0]);
    // console.log('financing:', financings[0]);
    // console.log('status:', statuses[0]);
    // console.log('orientation:', orientationsArr[0]);
    // console.log('nationality:', nationalitiesArr[0]);

  // Création de 3000 étudiants différents
  for (let i = 1; i <= 3000; i++) {
    const firstname = firstnames[Math.floor(Math.random() * firstnames.length)];
    const lastname = lastnames[Math.floor(Math.random() * lastnames.length)];
    try {
      await prisma.student.create({
        data: {
          student_firstname: firstname,
          student_lastname: lastname,
          student_birthdate: new Date(1990 + (i % 20), i % 12, 1 + (i % 28)),
          student_mail: `${firstname.toLowerCase()}.${lastname.toLowerCase()}${i}@example.com`,
          gender_uuid: genders[Math.floor(Math.random() * genders.length)].gender_uuid,
          french_level_uuid: frenchLevels[Math.floor(Math.random() * frenchLevels.length)].french_level_uuid,
          status_uuid: statuses[Math.floor(Math.random() * statuses.length)].status_uuid,
          financing_uuid: financings[Math.floor(Math.random() * financings.length)].financing_uuid,
          orientation_uuid: orientationsArr[Math.floor(Math.random() * orientationsArr.length)].orientation_uuid,
          nationalities: {
            create: [{ nationality_uuid: nationalitiesArr[Math.floor(Math.random() * nationalitiesArr.length)].nationality_uuid }],
          },
          groups: {
            create: [{ group_uuid: groupsArr[Math.floor(Math.random() * groupsArr.length)].group_uuid }],
          },
        },
      });
      if (i % 100 === 0) {
        // console.log(`Créés : ${i} étudiants`);
      }
    } catch (e) {
      console.error(`Erreur à l'étudiant ${i}:`, e);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 