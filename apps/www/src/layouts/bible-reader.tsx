import type { JSX } from 'solid-js';
import { WithHeaderLayout } from './with-header';

export default function BibleReaderLayout(props: { children: JSX.Element }) {
  return (
    <WithHeaderLayout>
      <div class='container max-w-3xl'>{props.children}</div>
    </WithHeaderLayout>
  );
}
