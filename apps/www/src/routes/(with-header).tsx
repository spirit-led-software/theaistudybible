import { NavigationHeader, NavigationHeaderProvider } from '@/www/components/navigation/header';
import type { JSXElement } from 'solid-js';

export default function WithHeaderLayout(props: { children: JSXElement }) {
  return (
    <div class='flex w-full flex-col'>
      <NavigationHeaderProvider>
        <NavigationHeader />
        <main class='flex w-full flex-1 flex-col'>{props.children}</main>
      </NavigationHeaderProvider>
    </div>
  );
}
