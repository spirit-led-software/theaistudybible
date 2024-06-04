import type { JSX } from 'solid-js';
import { useClerk } from '~/hooks/clerk';

export type ClerkLoadingProps = {
  children: JSX.Element;
};

export default function ClerkLoading(props: ClerkLoadingProps) {
  const clerk = useClerk();
  return clerk().loaded ? null : props.children;
}
