describe('Chat', () => {
  it('should redirect to the sign-in page if not logged in', () => {
    cy.visit('/chat');
    cy.url().should('include', '/sign-in');
  });

  it('should show the chat page if logged in', () => {
    cy.login(Cypress.env('ADMIN_EMAIL'), Cypress.env('ADMIN_PASSWORD'));
    cy.visit('/chat');
    cy.url().should('include', '/chat');
  });
});
