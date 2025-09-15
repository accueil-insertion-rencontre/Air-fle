import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@airfle.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminFirstname = process.env.ADMIN_FIRSTNAME || 'Admin';
    const adminLastname = process.env.ADMIN_LASTNAME || 'Air-FLE';

    console.log('🔐 Création de l\'utilisateur admin...');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`👤 Nom: ${adminFirstname} ${adminLastname}`);

    // Vérifier que le rôle admin existe
    const adminRole = await prisma.role.findFirst({
      where: { role_name: 'admin' },
    });

    if (!adminRole) {
      console.log('❌ Le rôle admin n\'existe pas. Créez d\'abord les données de référence.');
      process.exit(1);
    }

    // Hasher le mot de passe
    const hashedPassword = await argon2.hash(adminPassword);

    // Créer ou mettre à jour l'utilisateur admin
    const adminUser = await prisma.user.upsert({
      where: { user_mail: adminEmail },
      update: {
        user_password: hashedPassword,
        user_firstname: adminFirstname,
        user_lastname: adminLastname,
        user_isactive: true,
      },
      create: {
        user_mail: adminEmail,
        user_password: hashedPassword,
        user_firstname: adminFirstname,
        user_lastname: adminLastname,
        user_isactive: true,
        user_created_at: new Date(),
        role_uuid: adminRole.role_uuid,
      },
    });

    console.log('✅ Utilisateur admin créé avec succès !');
    console.log(`🆔 UUID: ${adminUser.user_uuid}`);
    console.log('🔒 N\'oubliez pas de changer le mot de passe en production !');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin(); 