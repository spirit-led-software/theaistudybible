describe('Chat Page', () => {
  Cypress.on('uncaught:exception', (err) => {
    console.log(err);
    // Ignore uncaught exceptions for the chat page
    return false;
  });

  it('should redirect to the sign-in page if not logged in', () => {
    cy.visit('/chat');
    cy.url().should('include', '/sign-in');
  });

  it('should show the chat page if logged in', () => {
    cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'));
    cy.visit('/chat');
    cy.url().should('include', '/chat');
  });
});
