describe('Devotion Pages', () => {
  beforeEach(() => {
    cy.visit('/devotion');
  });

  it('redirects to the latest devotion from the index page', () => {
    cy.url().should('match', /\/devotion\/[\w-]+$/);
  });

  it('displays the devotion content correctly', () => {
    cy.get('img[alt="Illustration for the devotion"]').scrollIntoView().should('be.visible');
    cy.get('h2').contains('Reading').scrollIntoView().should('be.visible');
    cy.get('h2').contains('Summary').scrollIntoView().should('be.visible');
    cy.get('h2').contains('Reflection').scrollIntoView().should('be.visible');
    cy.get('h2').contains('Prayer').scrollIntoView().should('be.visible');
  });

  it('navigates through devotion history using the sidebar', () => {
    cy.get('button[aria-label="View Devotions"]').should('be.enabled').click();
    cy.get('div[role="dialog"]').should('be.visible');
  });

  it('handles non-existent devotion gracefully', () => {
    cy.visit('/devotion/non-existent-id');
    cy.contains('Devotion not found').should('be.visible');
  });
});
