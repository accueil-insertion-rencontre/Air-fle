/// <reference types="cypress" />

describe('Tests de Sanitisation XSS - Authentification Corrigée', () => {
  before(() => {
    // Connexion unique au début de tous les tests
    cy.visit('/auth/login')
    cy.get('#email').type('admin@airfle.com')
    cy.get('#password').type('Admin123')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/dashboard')
  })

  beforeEach(() => {
    // Simuler un utilisateur connecté avec des cookies
    cy.setCookie('auth_token', 'fake-jwt-token-for-tests')
    
    // Intercepter l'API d'authentification
    cy.intercept('POST', '/api/auth/login', { 
      statusCode: 200, 
      body: { 
        success: true, 
        data: {
          access_token: 'fake-jwt-token-for-tests',
          user: { id: '123', email: 'admin@airfle.com', role: 'Admin123' }
        }
      }
    }).as('login')

    // Intercepter toutes les requêtes API pour les données de référence
    cy.intercept('GET', '**/genders', { 
      statusCode: 200, 
      body: { 
        success: true,
        data: [
          { gender_uuid: '1', gender_label: 'Homme' }, 
          { gender_uuid: '2', gender_label: 'Femme' }
        ] 
      }
    }).as('getGenders')

    cy.intercept('GET', '**/nationalities', { 
      statusCode: 200, 
      body: { 
        success: true,
        data: [
          { nationality_uuid: '1', nationality_label: 'Française' }, 
          { nationality_uuid: '2', nationality_label: 'Espagnole' }
        ] 
      }
    }).as('getNationalities')

    cy.intercept('GET', '**/french-levels', { 
      statusCode: 200, 
      body: { 
        success: true,
        data: [
          { french_level_uuid: '1', french_level_code: 'A1', french_level_description: 'Débutant' },
          { french_level_uuid: '2', french_level_code: 'A2', french_level_description: 'Élémentaire' }
        ] 
      }
    }).as('getFrenchLevels')

    cy.intercept('GET', '**/statuses', { 
      statusCode: 200, 
      body: { 
        success: true,
        data: [
          { status_uuid: '1', status_label: 'Actif' },
          { status_uuid: '2', status_label: 'Inactif' }
        ] 
      }
    }).as('getStatuses')

    cy.intercept('GET', '**/financings', { 
      statusCode: 200, 
      body: { 
        success: true,
        data: [
          { financing_uuid: '1', financing_type: 'Public' },
          { financing_uuid: '2', financing_type: 'Privé' }
        ] 
      }
    }).as('getFinancings')

    cy.intercept('GET', '**/orientations', { 
      statusCode: 200, 
      body: { 
        success: true,
        data: [
          { orientation_uuid: '1', orientation_type: 'Formation' },
          { orientation_uuid: '2', orientation_type: 'Emploi' }
        ] 
      }
    }).as('getOrientations')

    cy.intercept('GET', '**/disabilities', { 
      statusCode: 200, 
      body: { 
        success: true,
        data: [
          { disability_uuid: '1', disability_label: 'Aucun', disability_description: 'Aucun handicap' }
        ] 
      }
    }).as('getDisabilities')

    cy.intercept('GET', '**/exit-reasons', { 
      statusCode: 200, 
      body: { 
        success: true,
        data: [
          { exit_reason_uuid: '1', exit_reason_reason: 'Fin de formation' }
        ] 
      }
    }).as('getExitReasons')

    // Intercepter la création d'étudiant
    cy.intercept('POST', '**/students', { 
      statusCode: 201, 
      body: { success: true, data: { id: '123' } }
    }).as('createStudent')
  })

  describe('Test de base - Chargement de l\'application', () => {
    it('devrait charger l\'application et naviguer vers le formulaire étudiant', () => {
      // Naviguer vers le formulaire de création d'étudiant (on est déjà connecté)
      cy.visit('/dashboard/apprenants/new')
      cy.url().should('include', '/apprenants/new')
      
      // Vérifier que le formulaire se charge
      cy.get('h1').should('contain', 'Ajouter un apprenant')
      cy.get('#firstname').should('be.visible')
    })
  })

  describe('Étape 1 - Informations personnelles', () => {
    beforeEach(() => {
      // Aller directement au formulaire étudiant (on est déjà connecté)
      cy.visit('/dashboard/apprenants/new')
      cy.url().should('include', '/apprenants/new')
    })

    it('devrait sanitiser les scripts dans le prénom', () => {
      const maliciousScript = '<script>alert("XSS Attack!")</script>Jean'
      const expectedOutput = 'Jean'

      // Vérifier qu'aucune alerte n'existe déjà
      cy.window().then((win) => {
        cy.stub(win, 'alert').as('windowAlert')
      })

      // Test avec script malveillant dans le prénom
      cy.get('#firstname').clear()
      cy.get('#firstname').type(maliciousScript, { parseSpecialCharSequences: false })
      cy.get('#firstname').blur()

      // Vérifier que le script est sanitisé
      cy.get('#firstname').should('have.value', expectedOutput)
      
      // Vérifier qu'aucune alerte ne s'affiche
      cy.get('@windowAlert').should('not.have.been.called')
    })

    it('devrait sanitiser les scripts dans le nom', () => {
      const maliciousScript = 'Dupont<iframe src="javascript:alert(\'XSS\')">'
      const expectedOutput = 'Dupont'

      cy.window().then((win) => {
        cy.stub(win, 'alert').as('windowAlert')
      })

      cy.get('#lastname').clear()
      cy.get('#lastname').type(maliciousScript, { parseSpecialCharSequences: false })
      cy.get('#lastname').blur()

      cy.get('#lastname').should('have.value', expectedOutput)
      cy.get('@windowAlert').should('not.have.been.called')
    })

    it('devrait préserver le contenu légitime', () => {
      const legitimateData = {
        firstname: 'Jean-Pierre',
        lastname: "O'Connor-Smith",
        placeOfBirth: 'Paris, France'
      }

      // Saisir des données légitimes
      cy.get('#firstname').type(legitimateData.firstname)
      cy.get('#lastname').type(legitimateData.lastname)  
      cy.get('#placeOfBirth').type(legitimateData.placeOfBirth)

      // Vérifier que les données sont préservées
      cy.get('#firstname').should('have.value', legitimateData.firstname)
      cy.get('#lastname').should('have.value', legitimateData.lastname)
      cy.get('#placeOfBirth').should('have.value', legitimateData.placeOfBirth)
    })
  })

  describe('Tests simplifiés de sécurité', () => {
    beforeEach(() => {
      // Aller directement au formulaire (on est déjà connecté)
      cy.visit('/dashboard/apprenants/new')
    })

    const maliciousPayloads = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(\'XSS\')">',
      '<svg onload="alert(\'XSS\')">',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')">',
    ]

    maliciousPayloads.forEach((payload, index) => {
      it(`devrait sanitiser le payload XSS ${index + 1}: ${payload.substring(0, 20)}...`, () => {
        cy.window().then((win) => {
          cy.stub(win, 'alert').as('windowAlert')
        })
        
        // Tester avec le prénom
        cy.get('#firstname').clear()
        cy.get('#firstname').type(payload, { parseSpecialCharSequences: false })
        cy.get('#firstname').blur()

        // Vérifier qu'aucun script n'est exécuté
        cy.get('@windowAlert').should('not.have.been.called')

        // Vérifier que le contenu est sanitisé
        cy.get('#firstname').then(($input) => {
          const value = $input.val() as string
          expect(value).to.not.include('<script>')
          expect(value).to.not.include('<iframe>')
          expect(value).to.not.include('javascript:')
          expect(value).to.not.include('onerror')
          expect(value).to.not.include('onload')
        })
      })
    })
  })

  describe('Tests de sanitisation pour nouveaux champs étudiant', () => {
    beforeEach(() => {
      // Aller directement au formulaire (on est déjà connecté)
      cy.visit('/dashboard/apprenants/new')
    })

    it('devrait sanitiser l\'email avec scripts', () => {
      const maliciousEmail = 'test<script>alert("hack")</script>@example.com'
      const expectedOutput = 'test@example.com'

      cy.window().then((win) => {
        cy.stub(win, 'alert').as('windowAlert')
      })

      cy.get('#email').clear()
      cy.get('#email').type(maliciousEmail, { parseSpecialCharSequences: false })
      cy.get('#email').blur()

      cy.get('#email').should('have.value', expectedOutput)
      cy.get('@windowAlert').should('not.have.been.called')
    })

    it('devrait sanitiser le téléphone avec scripts', () => {
      const maliciousPhone = '+33<script>alert()</script>123456789'
      const expectedOutput = '+33123456789'

      cy.window().then((win) => {
        cy.stub(win, 'alert').as('windowAlert')
      })

      cy.get('#phone').clear()
      cy.get('#phone').type(maliciousPhone, { parseSpecialCharSequences: false })
      cy.get('#phone').blur()

      cy.get('#phone').should('have.value', expectedOutput)
      cy.get('@windowAlert').should('not.have.been.called')
    })

    it('devrait sanitiser le commentaire avec scripts', () => {
      const maliciousComment = 'Commentaire <script>alert("XSS")</script> normal'
      
      cy.window().then((win) => {
        cy.stub(win, 'alert').as('windowAlert')
      })

      cy.get('#commentaire').clear()
      cy.get('#commentaire').type(maliciousComment, { parseSpecialCharSequences: false })
      cy.get('#commentaire').blur()

      // Vérifier qu'aucun script n'est exécuté
      cy.get('@windowAlert').should('not.have.been.called')

      // Vérifier que le contenu malveillant est supprimé
      cy.get('#commentaire').then(($textarea) => {
        const value = $textarea.val() as string
        expect(value).to.not.include('<script>')
        expect(value).to.not.include('alert("XSS")')
      })
    })

    it('devrait préserver les données légitimes dans tous les champs', () => {
      const legitData = {
        email: 'jean.pierre@example.com',
        phone: '+33 1 23 45 67 89',
        placeOfBirth: 'Paris, France',
        commentaire: 'Étudiant très motivé et assidu aux cours.'
      }

      // Saisir des données légitimes
      cy.get('#email').clear().type(legitData.email)
      cy.get('#phone').clear().type(legitData.phone)
      cy.get('#placeOfBirth').clear().type(legitData.placeOfBirth)
      cy.get('#commentaire').clear().type(legitData.commentaire)

      // Vérifier que toutes les données sont préservées
      cy.get('#email').should('have.value', legitData.email)
      cy.get('#phone').should('have.value', legitData.phone)
      cy.get('#placeOfBirth').should('have.value', legitData.placeOfBirth)
      cy.get('#commentaire').should('have.value', legitData.commentaire)
    })
  })
}) 