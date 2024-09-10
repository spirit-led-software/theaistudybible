import type { JSXElement } from 'solid-js';
import NavigationHeader from '../components/navigation/header';

export default function WithHeaderLayout(props: { children: JSXElement }) {
  return (
    <div class="flex h-full w-full flex-col">
      <NavigationHeader />
      <main class="flex h-full w-full flex-1 flex-col pt-20">{props.children}</main>
    </div>
  );
}
