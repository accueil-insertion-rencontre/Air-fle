/// <reference types="cypress" />

describe('Tests d\'Authentification - Connexion et Déconnexion', () => {
  
  beforeEach(() => {
    // Nettoyer les cookies et localStorage avant chaque test
    cy.clearCookies()
    cy.clearLocalStorage()
    
    // Intercepter l'API d'authentification pour la connexion
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          access_token: 'fake-jwt-token-for-tests',
          user: {
            user_uuid: '123-456-789',
            user_firstname: 'Jean',
            user_lastname: 'Dupont',
            user_mail: 'admin@airfle.com',
            user_role: 'Admin',
            user_isactive: true
          }
        }
      }
    }).as('loginRequest')

    // Intercepter l'API de déconnexion
    cy.intercept('POST', '**/auth/logout', {
      statusCode: 200,
      body: { success: true }
    }).as('logoutRequest')
  })

  describe('Tests de Connexion', () => {
    
    it('devrait afficher la page de connexion', () => {
      cy.visit('/auth/login')
      
      // Vérifier que les éléments essentiels sont présents
      cy.get('#email').should('be.visible')
      cy.get('#password').should('be.visible')
      cy.get('button[type="submit"]').should('be.visible')
    })

    it('devrait se connecter avec des identifiants valides', () => {
      cy.visit('/auth/login')
      
      // Saisir des identifiants valides
      cy.get('#email').type('admin@airfle.com')
      cy.get('#password').type('Admin123')
      
      // Soumettre le formulaire
      cy.get('button[type="submit"]').click()
      
      // Vérifier que la requête de connexion a été envoyée
      cy.wait('@loginRequest')
      
      // Vérifier la redirection vers le dashboard
      cy.url().should('include', '/dashboard')
    })
  })

  describe('Tests de Déconnexion', () => {
    
    beforeEach(() => {
      // Se connecter avant chaque test de déconnexion
      cy.visit('/auth/login')
      cy.get('#email').type('admin@airfle.com')
      cy.get('#password').type('Admin123')
      cy.get('button[type="submit"]').click()
      cy.wait('@loginRequest')
      cy.url().should('include', '/dashboard')
    })

    it('devrait se déconnecter avec succès', () => {
      // Ouvrir le menu utilisateur et cliquer sur Déconnexion
      cy.get('.user-profile', { timeout: 10000 }).should('be.visible').click()
      cy.get('.dropdown-item').contains('Déconnexion').click()
      
      // Vérifier la redirection vers la page de connexion
      cy.url().should('include', '/auth/login')
    })
  })
}) 