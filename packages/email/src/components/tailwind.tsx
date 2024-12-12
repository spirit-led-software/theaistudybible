import { Tailwind as TailwindBase } from '@react-email/components';
import tailwindConfig from '../../tailwind.config';

export const Tailwind = ({ children }: { children: React.ReactNode }) => {
  return <TailwindBase config={tailwindConfig}>{children}</TailwindBase>;
};
