import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { FinancingModule } from '../../src/financing/financing.module';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/auth/guards/roles.guard';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from '../../src/common/filters/http-exception.filter';

// Mock Guards qui laissent passer toutes les requêtes pour les tests
class MockJwtAuthGuard {
  constructor() {}

  canActivate() {
    return true; // Toujours autoriser en mode test
  }
}

class MockRolesGuard {
  constructor() {}

  canActivate() {
    return true; // Toujours autoriser en mode test
  }
}

// Tests d'intégration Financing - Endpoints HTTP complets
describe("Tests d'intégration Financing - Endpoints HTTP", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let testFinancingId: string | null = null;

  beforeAll(async () => {
    // Variables d'environnement pour les tests
    process.env.JWT_SECRET =
      'votre_clé_secrète_très_sécurisée_pour_production_dev_2024';
    process.env.NODE_ENV = 'test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
        }),
        PrismaModule,
        FinancingModule,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(MockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();

    // Configuration identique à main.ts
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());
    app.enableCors();

    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Nettoyer les données de test
    if (testFinancingId) {
      try {
        await prismaService.financing.delete({
          where: { financing_uuid: testFinancingId },
        });
      } catch (error) {
        // Le financement a peut-être déjà été supprimé
      }
    }

    if (app) {
      await app.close();
    }
  });

  // TEST 1: Récupérer la liste des financements
  it('devrait permettre de récupérer la liste des financements', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/financings');

    // Debug en cas d'erreur
    if (res.status !== 200) {
      console.log('❌ Erreur 500 détails:', res.body);
    }

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    console.log(
      `✅ GET /financings: ${res.body.data.length} financements trouvés`,
    );
  });

  // TEST 2: Créer un financement
  it('devrait permettre de créer un financement via API', async () => {
    const financingData = {
      financing_type: 'Test Intégration HTTP',
    };

    const res = await request(app.getHttpServer())
      .post('/api/v1/financings')
      .send(financingData)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.financing_type).toBe('Test Intégration HTTP');
    expect(res.body.data.financing_uuid).toBeDefined();

    testFinancingId = res.body.data.financing_uuid;
    console.log(`✅ POST /financings: Créé avec UUID ${testFinancingId}`);
  });

  // TEST 3: Récupérer un financement par UUID
  it('devrait permettre de récupérer un financement par UUID', async () => {
    if (!testFinancingId) {
      throw new Error('Aucun financement créé pour ce test');
    }

    const res = await request(app.getHttpServer())
      .get(`/api/v1/financings/${testFinancingId}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.financing_uuid).toBe(testFinancingId);
    expect(res.body.data.financing_type).toBe('Test Intégration HTTP');
    console.log(`✅ GET /financings/${testFinancingId}: Récupéré avec succès`);
  });

  // TEST 4: Modifier un financement
  it('devrait permettre de modifier un financement', async () => {
    if (!testFinancingId) {
      throw new Error('Aucun financement créé pour ce test');
    }

    const updateData = {
      financing_type: 'Test HTTP Modifié',
    };

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/financings/${testFinancingId}`)
      .send(updateData)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.financing_type).toBe('Test HTTP Modifié');
    console.log(`✅ PATCH /financings/${testFinancingId}: Modifié avec succès`);
  });

  // TEST 5: 404 pour financement inexistant
  it('devrait retourner 404 pour un financement inexistant', async () => {
    const fakeUuid = '00000000-0000-0000-0000-000000000000';

    const res = await request(app.getHttpServer())
      .get(`/api/v1/financings/${fakeUuid}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    console.log(`✅ GET /financings/${fakeUuid}: 404 OK`);
  });

  // TEST 6: Supprimer un financement
  it('devrait permettre de supprimer un financement', async () => {
    if (!testFinancingId) {
      throw new Error('Aucun financement créé pour ce test');
    }

    const res = await request(app.getHttpServer())
      .delete(`/api/v1/financings/${testFinancingId}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.financing_uuid).toBe(testFinancingId);

    // Vérifier que le financement n'existe plus
    await request(app.getHttpServer())
      .get(`/api/v1/financings/${testFinancingId}`)
      .expect(404);

    console.log(
      `✅ DELETE /financings/${testFinancingId}: Supprimé avec succès`,
    );
    testFinancingId = null; // Plus besoin de le nettoyer
  });

  // TEST 7: Test de flux complet CRUD via HTTP
  it('devrait permettre un flux CRUD complet via HTTP', async () => {
    // 1. Créer
    const createData = {
      financing_type: 'Test CRUD HTTP Complet',
    };

    const createRes = await request(app.getHttpServer())
      .post('/api/v1/financings')
      .send(createData)
      .expect(201);

    const createdId = createRes.body.data.financing_uuid;
    expect(createRes.body.data.financing_type).toBe('Test CRUD HTTP Complet');

    // 2. Lire
    const readRes = await request(app.getHttpServer())
      .get(`/api/v1/financings/${createdId}`)
      .expect(200);

    expect(readRes.body.data.financing_type).toBe('Test CRUD HTTP Complet');

    // 3. Modifier
    const updateData = {
      financing_type: 'Test CRUD HTTP Modifié',
    };

    const updateRes = await request(app.getHttpServer())
      .patch(`/api/v1/financings/${createdId}`)
      .send(updateData)
      .expect(200);

    expect(updateRes.body.data.financing_type).toBe('Test CRUD HTTP Modifié');

    // 4. Supprimer
    await request(app.getHttpServer())
      .delete(`/api/v1/financings/${createdId}`)
      .expect(200);

    // 5. Vérifier suppression
    await request(app.getHttpServer())
      .get(`/api/v1/financings/${createdId}`)
      .expect(404);

    console.log(`✅ CRUD complet: Créé, lu, modifié et supprimé ${createdId}`);
  });
});
