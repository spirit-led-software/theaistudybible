import type { JSX } from 'solid-js';

export default function BibleReaderLayout(props: { children: JSX.Element }) {
  return <div class='container h-full w-full max-w-3xl flex-1'>{props.children}</div>;
}
