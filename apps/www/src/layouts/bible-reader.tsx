import { useReadingSessionContext } from '@/www/contexts/reading-session-context';
import { type JSX, onCleanup, onMount } from 'solid-js';
import { WithHeaderLayout } from './with-header';

export default function BibleReaderLayout(props: { children: JSX.Element }) {
  const { startReading, stopReading } = useReadingSessionContext();

  onMount(() => {
    startReading();
    onCleanup(() => {
      void stopReading();
    });
  });

  return (
    <WithHeaderLayout>
      <div class='container max-w-3xl'>{props.children}</div>
    </WithHeaderLayout>
  );
}
