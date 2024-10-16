Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/sign-in');
  cy.get('form').should('be.visible');

  // Type email and password, ensuring fields are enabled before each action
  cy.get('input[name="email"]')
    .should('be.enabled')
    .then(($el) => {
      if ($el.is(':enabled')) {
        cy.wrap($el).type(email);
      }
    });

  cy.get('input[name="password"]')
    .should('be.enabled')
    .then(($el) => {
      if ($el.is(':enabled')) {
        cy.wrap($el).type(password);
      }
    });

  // Click submit button if it's enabled
  cy.get('button[type="submit"]')
    .should('be.enabled')
    .then(($el) => {
      if ($el.is(':enabled')) {
        cy.wrap($el).click();
      }
    });

  // Wait for either the auth_session cookie or redirection to the Bible page
  cy.waitUntil(() => cy.getCookie('auth_session').then((cookie) => cookie !== null), {
    timeout: Cypress.config('defaultCommandTimeout') * 5,
    interval: 200,
    errorMsg: 'Timed out waiting for authentication or redirection',
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
