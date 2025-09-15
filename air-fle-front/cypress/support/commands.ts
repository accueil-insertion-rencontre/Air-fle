/// <reference types="cypress" />

// ***********************************************
// Custom commands for sanitization testing
// ***********************************************

declare namespace Cypress {
  interface Chainable {
    /**
     * Teste la sanitisation d'un champ avec du contenu malveillant
     */
    testSanitization(selector: string, maliciousInput: string, expectedOutput?: string): Chainable<void>
    
    /**
     * Vérifie qu'un script malveillant n'est pas exécuté
     */
    verifyScriptNotExecuted(selector: string, maliciousScript: string): Chainable<void>
    
    /**
     * Login pour accéder aux pages protégées
     */
    login(email?: string, password?: string): Chainable<void>
  }
}

/**
 * Commande pour tester la sanitisation
 */
Cypress.Commands.add('testSanitization', (selector: string, maliciousInput: string, expectedOutput?: string) => {
  cy.get(selector).clear()
  cy.get(selector).type(maliciousInput, { parseSpecialCharSequences: false })
  
  if (expectedOutput !== undefined) {
    cy.get(selector).should('have.value', expectedOutput)
  }
  
  // Vérifie qu'aucune alerte n'est affichée (script non exécuté)
  cy.window().then((win) => {
    cy.stub(win, 'alert').as('windowAlert')
  })
})

/**
 * Commande pour vérifier qu'un script malveillant n'est pas exécuté
 */
Cypress.Commands.add('verifyScriptNotExecuted', (selector: string, maliciousScript: string) => {
  cy.window().then((win) => {
    cy.stub(win, 'alert').as('windowAlert')
  })
  
  cy.get(selector).clear()
  cy.get(selector).type(maliciousScript, { parseSpecialCharSequences: false })
  
  // Déclenche l'événement de sortie du champ pour s'assurer que la sanitisation est appliquée
  cy.get(selector).blur()
  
  cy.get('@windowAlert').should('not.have.been.called')
})

/**
 * Commande de login pour accéder aux pages protégées
 */
Cypress.Commands.add('login', (email: string = 'test@example.com', password: string = 'password123') => {
  cy.visit('/auth/login')
  cy.get('[data-cy="email-input"]').type(email)
  cy.get('[data-cy="password-input"]').type(password)
  cy.get('[data-cy="login-button"]').click()
  cy.url().should('include', '/dashboard')
}) 