import { Button } from '@/www/components/ui/button';
import { EMAIL, FACEBOOK, TWITTER } from '@solid-primitives/share';
import { Mail } from 'lucide-solid';

export type ShareButtonProps = {
  share: (network: string | undefined) => void;
};

export const XShareButton = (props: ShareButtonProps) => {
  return (
    <Button
      onClick={(e: MouseEvent) => {
        e.preventDefault();
        props.share(TWITTER);
      }}
    >
      <svg role='img' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' class='size-6'>
        <title>X</title>
        <path
          d='M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z'
          fill='white'
        />
      </svg>
    </Button>
  );
};

export const FacebookShareButton = (props: ShareButtonProps) => {
  return (
    <Button
      onClick={(e: MouseEvent) => {
        e.preventDefault();
        props.share(FACEBOOK);
      }}
    >
      <svg role='img' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' class='size-6'>
        <title>Facebook</title>
        <path
          d='M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z'
          fill='white'
        />
      </svg>
    </Button>
  );
};

export const EmailShareButton = (props: ShareButtonProps) => {
  return (
    <Button
      onClick={(e: MouseEvent) => {
        e.preventDefault();
        props.share(EMAIL);
      }}
    >
      <Mail />
    </Button>
  );
};
