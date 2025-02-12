import { NavigationFooter } from '@/www/components/navigation/footer';
import type { JSXElement } from 'solid-js';

export default function WithFooterLayout(props: { children: JSXElement }) {
  return (
    <>
      <div class='flex min-h-full w-full flex-1 flex-col'>{props.children}</div>
      <NavigationFooter />
    </>
  );
}
