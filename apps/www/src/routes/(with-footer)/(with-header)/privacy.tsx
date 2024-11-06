import { GradientH1, H2, H3, List, ListItem, Muted, P } from '@/www/components/ui/typography';
import { Meta, Title } from '@solidjs/meta';
import { formatDate } from 'date-fns';

export default function PrivacyPolicyPage() {
  return (
    <>
      <MetaTags />
      <div class='container mx-auto max-w-4xl px-4 py-12'>
        <header class='text-center'>
          <GradientH1>Privacy Policy</GradientH1>
          <Muted>
            Last updated: {formatDate(new Date('2024-10-21T10:00:00-04:00'), 'MMMM d, yyyy')}
          </Muted>
        </header>

        <div class='mt-12 space-y-12'>
          <section>
            <H2 class='mb-4'>1. Introduction</H2>
            <P>
              Welcome to The AI Study Bible ("we," "our," or "us"). We are committed to protecting
              your personal information and your right to privacy. This Privacy Policy explains how
              we collect, use, disclose, and safeguard your information when you visit our website
              theaistudybible.com or use our services.
            </P>
            <P class='mt-4'>
              Please read this privacy policy carefully. If you do not agree with the terms of this
              privacy policy, please do not access the site or use our services.
            </P>
          </section>

          <section>
            <H2 class='mb-4'>2. Information We Collect</H2>
            <H3 class='mb-2'>Personal Information You Disclose to Us</H3>
            <P>
              We collect personal information that you voluntarily provide to us when you register
              on the website, express an interest in obtaining information about us or our products
              and services, or otherwise contact us.
            </P>
            <P class='mt-2'>The personal information we collect may include:</P>
            <List>
              <ListItem>Name</ListItem>
              <ListItem>Email address</ListItem>
              <ListItem>Password</ListItem>
              <ListItem>Phone number</ListItem>
              <ListItem>Billing address</ListItem>
              <ListItem>Payment information</ListItem>
              <ListItem>Other information you choose to provide</ListItem>
            </List>
            <H3 class='mt-4 mb-2'>Information Automatically Collected</H3>
            <P>
              We automatically collect certain information when you visit, use, or navigate the
              website. This information does not reveal your specific identity but may include
              device and usage information, such as your IP address, browser and device
              characteristics, operating system, language preferences, referring URLs, device name,
              country, location, information about how and when you use our website, and other
              technical information.
            </P>
          </section>

          <section>
            <H2 class='mb-4'>3. How We Use Your Information</H2>
            <P>
              We use personal information collected via our website for a variety of business
              purposes, including:
            </P>
            <List>
              <ListItem>To provide and maintain our services</ListItem>
              <ListItem>To notify you about changes to our services</ListItem>
              <ListItem>
                To allow you to participate in interactive features of our website
              </ListItem>
              <ListItem>To provide customer support</ListItem>
              <ListItem>
                To gather analysis or valuable information so that we can improve our services
              </ListItem>
              <ListItem>To monitor the usage of our services</ListItem>
              <ListItem>To detect, prevent and address technical issues</ListItem>
              <ListItem>To fulfill any other purpose for which you provide it</ListItem>
              <ListItem>To carry out our obligations and enforce our rights</ListItem>
              <ListItem>In any other way we may describe when you provide the information</ListItem>
              <ListItem>For any other purpose with your consent</ListItem>
            </List>
          </section>

          <section>
            <H2 class='mb-4'>4. Disclosure of Your Information</H2>
            <P>We may disclose your personal information in the following situations:</P>
            <List>
              <ListItem>To our subsidiaries and affiliates</ListItem>
              <ListItem>
                To contractors, service providers, and other third parties we use to support our
                business
              </ListItem>
              <ListItem>To fulfill the purpose for which you provide it</ListItem>
              <ListItem>
                For any other purpose disclosed by us when you provide the information
              </ListItem>
              <ListItem>With your consent</ListItem>
              <ListItem>
                To comply with any court order, law, or legal process, including responding to any
                government or regulatory request
              </ListItem>
              <ListItem>To enforce or apply our terms of use and other agreements</ListItem>
              <ListItem>
                If we believe disclosure is necessary or appropriate to protect the rights,
                property, or safety of The AI Study Bible, our customers, or others
              </ListItem>
            </List>
          </section>

          <section>
            <H2 class='mb-4'>5. Your Rights and Choices</H2>
            <P>
              You have certain rights regarding the personal information we collect about you. These
              may include:
            </P>
            <List>
              <ListItem>
                The right to access and receive a copy of your personal information
              </ListItem>
              <ListItem>The right to rectify or update your personal information</ListItem>
              <ListItem>The right to erase your personal information</ListItem>
              <ListItem>The right to restrict processing of your personal information</ListItem>
              <ListItem>The right to object to processing of your personal information</ListItem>
              <ListItem>The right to data portability</ListItem>
              <ListItem>The right to withdraw consent</ListItem>
            </List>
            <P class='mt-4'>
              To exercise these rights, please contact us using the contact information provided at
              the end of this policy.
            </P>
          </section>

          <section>
            <H2 class='mb-4'>6. Data Security</H2>
            <P>
              We have implemented appropriate technical and organizational security measures
              designed to protect the security of any personal information we process. However,
              please also remember that we cannot guarantee that the internet itself is 100% secure.
            </P>
          </section>

          <section>
            <H2 class='mb-4'>7. Data Retention</H2>
            <P>
              We will only keep your personal information for as long as it is necessary for the
              purposes set out in this privacy policy, unless a longer retention period is required
              or permitted by law.
            </P>
          </section>

          <section>
            <H2 class='mb-4'>8. Children's Privacy</H2>
            <P>
              Our website is not directed to children under the age of 13, and we do not knowingly
              collect personal information from children under 13. If we learn we have collected or
              received personal information from a child under 13 without verification of parental
              consent, we will delete that information.
            </P>
          </section>

          <section>
            <H2 class='mb-4'>9. California Privacy Rights</H2>
            <P>
              If you are a California resident, you have additional rights under the California
              Consumer Privacy Act (CCPA). Please refer to our California Privacy Notice for more
              information.
            </P>
          </section>

          <section>
            <H2 class='mb-4'>10. Changes to This Privacy Policy</H2>
            <P>
              We may update our Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the "Last updated" date at
              the top of this Privacy Policy.
            </P>
          </section>

          <section>
            <H2 class='mb-4'>11. Contact Us</H2>
            <P>If you have any questions about this Privacy Policy, please contact us at:</P>
            <P class='mt-2'>
              <strong class='font-goldman'>The AI Study Bible</strong>
              <br />
              Email:{' '}
              <a href='mailto:privacy@theaistudybible.com' class='text-primary hover:underline'>
                privacy@theaistudybible.com
              </a>
              <br />
              Phone: +1 (401) 871-3235
            </P>
          </section>
        </div>
      </div>
    </>
  );
}

const MetaTags = () => {
  const title = 'Privacy Policy | The AI Study Bible - Your Data Security';
  const description =
    'Read our privacy policy to understand how The AI Study Bible protects your data, ensures your privacy, and maintains the security of your Bible study experience.';

  return (
    <>
      <Title>{title}</Title>
      <Meta name='description' content={description} />
      <Meta property='og:title' content={title} />
      <Meta property='og:description' content={description} />
      <Meta name='twitter:card' content='summary' />
      <Meta name='twitter:title' content={title} />
      <Meta name='twitter:description' content={description} />
    </>
  );
};
