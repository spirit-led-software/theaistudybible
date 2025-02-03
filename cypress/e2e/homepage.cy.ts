describe('Homepage', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('displays the correct content for signed-out users', () => {
    // Check early access banner
    cy.contains('Early Access Now Available').should('be.visible');

    // Check hero section
    cy.contains('h1', 'Transform Your Bible Study with AI').should('be.visible');
    cy.contains('Get deeper insights, personalized explanations').should('be.visible');
    cy.contains('Get Started for Free').should('be.visible').and('have.attr', 'href', '/bible');
    cy.contains('No credit card required').should('be.visible');

    // Check trust indicators
    cy.contains('4').should('be.visible');
    cy.contains('Bible Translations').should('be.visible');
    cy.contains('24/7').should('be.visible');
    cy.contains('AI Assistance').should('be.visible');
    cy.contains('100%').should('be.visible');
    cy.contains('Privacy Focused').should('be.visible');

    // Check feature section
    cy.contains('h2', 'Discover the Power of AI-Assisted Bible Study').should('be.visible');

    // Check individual features
    const features = [
      {
        title: 'Deeper Understanding',
        description:
          'Explore the Bible with AI-powered insights, highlighting verses, and seamless navigation between translations.',
      },
      {
        title: 'AI Conversations',
        description:
          'Engage in meaningful dialogues with AI bots for insightful explanations and interpretations of any verse.',
      },
      {
        title: 'Advanced Search',
        description:
          'Discover interconnected verses with our powerful vector search, uncovering deep semantic relationships.',
      },
      {
        title: 'Daily Devotions',
        description:
          'Get a daily devotional with a verse of the day, a daily prayer, and a daily reflection.',
      },
    ];

    for (const feature of features) {
      cy.contains('h3', feature.title).should('be.visible');
      cy.contains('p', feature.description).should('be.visible');
    }

    // Check call to action section
    cy.contains('h2', 'Be Among the First to Experience AI-Powered Bible Study').should(
      'be.visible',
    );
    cy.contains('Get Started Free').should('be.visible');
    cy.contains('Learn More').should('be.visible').and('have.attr', 'href', '/about');
  });

  it('redirects signed-in users to the Bible page', () => {
    cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'));
    cy.visit('/');
    cy.url().should('include', '/bible');
  });

  it('navigates to the Bible page when "Get Started" is clicked', () => {
    cy.contains('Get Started for Free').click();
    cy.url().should('include', '/bible');
  });

  it('navigates to the About page when "Learn More" is clicked', () => {
    cy.contains('Learn More').click();
    cy.url().should('include', '/about');
  });
});
