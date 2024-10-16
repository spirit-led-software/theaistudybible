describe('Homepage', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('displays the correct content for signed-out users', () => {
    // Check header elements
    cy.get('header').within(() => {
      cy.get('img').should('be.visible');
      cy.contains('Get Started').should('be.visible').and('have.attr', 'href', '/bible');
    });

    // Check hero section
    cy.contains('h1', 'The AI Study Bible').should('be.visible');
    cy.contains('Unlock Divine Wisdom Anytime, Anywhere with AI-Powered Insights').should(
      'be.visible',
    );
    cy.contains('Start Your Journey').should('be.visible').and('have.attr', 'href', '/bible');
    cy.contains('Learn More').should('be.visible').and('have.attr', 'href', '/about');

    // Check feature section
    cy.contains('h2', 'Discover the Power of AI-Assisted Bible Study').should('be.visible');

    // Check individual features
    const features = [
      { title: 'Deeper Understanding', description: 'Explore the Bible with AI-powered insights' },
      { title: 'AI Conversations', description: 'Engage in meaningful dialogues with AI bots' },
      {
        title: 'Advanced Search',
        description: 'Discover interconnected verses with our powerful vector search',
      },
    ];

    for (const feature of features) {
      cy.contains('h3', feature.title).should('be.visible');
      cy.contains('p', feature.description).should('be.visible');
    }
  });

  it('redirects signed-in users to the Bible page', () => {
    cy.login(Cypress.env('ADMIN_EMAIL'), Cypress.env('ADMIN_PASSWORD'));
    cy.visit('/');
    cy.url().should('include', '/bible');
  });

  it('navigates to the Bible page when "Get Started" is clicked', () => {
    cy.contains('Get Started').click();
    cy.url().should('include', '/bible');
  });

  it('navigates to the About page when "Learn More" is clicked', () => {
    cy.contains('Learn More').click();
    cy.url().should('include', '/about');
  });
});
