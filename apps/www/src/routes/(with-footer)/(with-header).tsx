import type { JSXElement } from 'solid-js';
import { NavigationHeader, NavigationHeaderProvider } from '../../components/navigation/header';

export default function WithHeaderLayout(props: { children: JSXElement }) {
  return (
    <div class='flex w-full flex-1 flex-col'>
      <NavigationHeaderProvider>
        <NavigationHeader />
        <main class='flex w-full flex-1 flex-col'>{props.children}</main>
      </NavigationHeaderProvider>
    </div>
  );
}
