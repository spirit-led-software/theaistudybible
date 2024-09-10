import type { JSX } from 'solid-js';

export default function AboutLayout(props: { children: JSX.Element }) {
  return (
    <div class="container flex max-w-3xl flex-1 flex-col justify-center p-5 pb-20">
      {props.children}
    </div>
  );
}
