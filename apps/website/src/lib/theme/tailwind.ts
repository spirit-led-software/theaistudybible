import tailwindConfig from '@/tailwind.config';
import resolveConfig from 'tailwindcss/resolveConfig';

export const resolvedTailwindConfig = resolveConfig(tailwindConfig);
