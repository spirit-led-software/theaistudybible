import type { JSX } from 'solid-js';

export default function BibleReaderLayout(props: { children: JSX.Element }) {
  return <div class='mx-auto flex h-full w-full max-w-3xl flex-1'>{props.children}</div>;
}
