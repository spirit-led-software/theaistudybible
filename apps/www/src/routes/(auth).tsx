import type { JSX } from 'solid-js';

export default function AuthLayout(props: { children: JSX.Element }) {
  return <div class='flex min-h-screen items-center justify-center'>{props.children}</div>;
}
