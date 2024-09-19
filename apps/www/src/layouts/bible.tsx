import type { JSXElement } from 'solid-js';
import { ReadingSessionProvider } from '../contexts/reading-session-context';

export function BibleLayout(props: { children: JSXElement }) {
  return <ReadingSessionProvider>{props.children}</ReadingSessionProvider>;
}
