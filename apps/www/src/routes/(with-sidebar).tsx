import type { JSXElement } from 'solid-js';

export default function WithHeaderLayout(props: { children: JSXElement }) {
  return (
    <div class='flex h-full w-full flex-1 flex-col'>
      <main class='flex h-full w-full flex-1 flex-col'>{props.children}</main>
    </div>
  );
}
