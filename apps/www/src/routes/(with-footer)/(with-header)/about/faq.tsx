import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/www/components/ui/accordion';
import { GradientH1, Muted } from '@/www/components/ui/typography';
import { Title } from '@solidjs/meta';
import type { Component } from 'solid-js';

type FAQItem = {
  question: string;
  answer: string;
};

const faqs: FAQItem[] = [
  {
    question: 'What is The AI Study Bible?',
    answer:
      'The AI Study Bible is a modern digital platform that combines traditional biblical study with artificial intelligence to provide deeper insights and understanding of scripture. It offers interactive study tools, AI-powered conversations, advanced semantic search, and personalized study experiences while maintaining respect for the sacred text.',
  },
  {
    question: 'What features are available?',
    answer:
      'Our platform includes: AI-powered insights and verse explanations, interactive conversations about scripture, advanced semantic search for discovering related verses, daily devotionals with personalized reflections, multiple Bible translations, verse highlighting, and seamless navigation between translations. We continuously add new features to enhance your study experience.',
  },
  {
    question: 'Is my data private and secure?',
    answer:
      'Yes, we take your privacy and security seriously. We implement appropriate technical and organizational security measures to protect your personal information. We only collect necessary data to provide our services, and we never share your personal information without your consent. You can read our detailed privacy policy for more information about how we handle your data.',
  },
  {
    question: 'How accurate are the AI-generated insights?',
    answer:
      'Our AI is designed to provide biblically sound insights based on scholarly research and traditional interpretations. We maintain high standards of accuracy by training our AI on trusted theological sources. However, we encourage users to view AI insights as study aids rather than definitive interpretations, and to always verify insights against Scripture and trusted theological resources.',
  },
  {
    question: 'Can I use the app offline?',
    answer:
      'Yes, The AI Study Bible is available as a Progressive Web App (PWA) that you can install on your device. This allows you to access basic features and read the Bible offline. However, AI-powered features require an internet connection to function.',
  },
  {
    question: 'How can I get help or support?',
    answer:
      'If you need assistance, you can contact our support team at support@theaistudybible.com. We also welcome feedback and suggestions through our feedback form. For technical issues with installation or usage, check our installation guide or reach out to our support team directly.',
  },
  {
    question: 'What Bible translations are available?',
    answer:
      'We offer multiple Bible translations to support your study needs. Our platform allows seamless navigation between different translations, helping you compare and understand scripture from various perspectives. The specific translations available may vary, and we regularly work to add more options.',
  },
];

const FAQ: Component = () => {
  return (
    <>
      <Title>FAQ | The AI Study Bible</Title>
      <div class='mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8'>
        <div class='max-w-4xl'>
          <GradientH1>Frequently Asked Questions</GradientH1>
          <Muted class='mt-4'>
            Find answers to common questions about The AI Study Bible platform. Can't find what
            you're looking for? Feel free to contact our support team.
          </Muted>
        </div>

        <div class='mt-12 max-w-4xl'>
          <Accordion multiple collapsible>
            {faqs.map((faq, index) => (
              <AccordionItem value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>
                  <Muted>{faq.answer}</Muted>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </>
  );
};

export default FAQ;
