import { NavigationHeader } from '@/www/components/navigation/header';
import type { JSXElement } from 'solid-js';

export default function WithHeaderLayout(props: { children: JSXElement }) {
  return (
    <div class='flex h-full w-full flex-col'>
      <NavigationHeader />
      <main class='flex h-full w-full flex-1 flex-col pt-20'>{props.children}</main>
    </div>
  );
}
