import { useReadingSessionContext } from '@/www/contexts/reading-session-context';
import { onCleanup, onMount, type JSX } from 'solid-js';

export default function BibleReaderLayout(props: { children: JSX.Element }) {
  const { startReading, stopReading } = useReadingSessionContext();

  onMount(() => {
    startReading();
    onCleanup(() => {
      void stopReading();
    });
  });

  return <div class='container max-w-3xl'>{props.children}</div>;
}
