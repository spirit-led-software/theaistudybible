/// <reference types="cypress" />

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/sign-in');
  cy.get('form').should('be.visible');
  cy.get('input[name="email"]').should('be.enabled').type(email);
  cy.get('input[name="password"]').should('be.enabled').type(password);
  cy.get('button[type="submit"]').should('be.enabled').click();
  cy.waitUntil(() => cy.getCookie('auth_session').then((cookie) => cookie !== null), {
    timeout: Cypress.config('defaultCommandTimeout') * 4,
    interval: 200,
    errorMsg: 'Timed out waiting for auth_session cookie',
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
    }
  }
}

export {};
