import type { JSX } from 'solid-js';

export default function BibleReaderLayout(props: { children: JSX.Element }) {
  return <div class='container max-w-3xl'>{props.children}</div>;
}
