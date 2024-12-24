import { Heading, Img, Link, Text } from '@react-email/components';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

export type MarkdownProps = {
  children: string;
};

export const Markdown = ({ children }: MarkdownProps) => {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children, ...props }) => (
          <Heading as='h1' {...props}>
            {children}
          </Heading>
        ),
        h2: ({ children, ...props }) => (
          <Heading as='h2' {...props}>
            {children}
          </Heading>
        ),
        h3: ({ children, ...props }) => (
          <Heading as='h3' {...props}>
            {children}
          </Heading>
        ),
        h4: ({ children, ...props }) => (
          <Heading as='h4' {...props}>
            {children}
          </Heading>
        ),
        h5: ({ children, ...props }) => (
          <Heading as='h5' {...props}>
            {children}
          </Heading>
        ),
        h6: ({ children, ...props }) => (
          <Heading as='h6' {...props}>
            {children}
          </Heading>
        ),
        p: ({ children, ...props }) => <Text {...props}>{children}</Text>,
        a: ({ children, href, ...props }) => (
          <Link href={href} {...props}>
            {children}
          </Link>
        ),
        img: ({ src, alt, ...props }) => <Img src={src} alt={alt} {...props} />,
        blockquote: ({ className, children, ...props }) => (
          <blockquote className={cn('border-primary border-l-2 pl-4', className)} {...props}>
            {children}
          </blockquote>
        ),
        ul: ({ className, children, ...props }) => (
          <ul className={cn('list-disc', className)} {...props}>
            {children}
          </ul>
        ),
        ol: ({ className, children, ...props }) => (
          <ol className={cn('list-decimal', className)} {...props}>
            {children}
          </ol>
        ),
        li: ({ className, children, ...props }) => (
          <li className={cn('my-2', className)} {...props}>
            {children}
          </li>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
};
