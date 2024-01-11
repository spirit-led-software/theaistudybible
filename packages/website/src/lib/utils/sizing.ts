export type ComponentSize =
	| '3xs'
	| '2xs'
	| 'xs'
	| 'sm'
	| 'md'
	| 'lg'
	| 'xl'
	| '2xl'
	| '3xl'
	| '4xl'
	| '5xl'
	| '6xl'
	| '7xl'
	| '8xl';

export const textSizeClasses: {
	[key in ComponentSize]: string;
} = {
	'3xs': 'text-3xs',
	'2xs': 'text-2xs',
	xs: 'text-xs',
	sm: 'text-sm',
	md: 'text-base',
	lg: 'text-lg',
	xl: 'text-xl',
	'2xl': 'text-2xl',
	'3xl': 'text-3xl',
	'4xl': 'text-4xl',
	'5xl': 'text-5xl',
	'6xl': 'text-6xl',
	'7xl': 'text-7xl',
	'8xl': 'text-8xl'
};

export const squareDimensions: {
	[key in ComponentSize]: number;
} = {
	'3xs': 2,
	'2xs': 3,
	xs: 4,
	sm: 6,
	md: 8,
	lg: 12,
	xl: 16,
	'2xl': 24,
	'3xl': 32,
	'4xl': 40,
	'5xl': 48,
	'6xl': 56,
	'7xl': 64,
	'8xl': 72
};

export const squareDimensionClasses: {
	[key in ComponentSize]: string;
} = {
	'3xs': 'w-2 h-2',
	'2xs': 'w-3 h-3',
	xs: 'w-4 h-4',
	sm: 'w-6 h-6',
	md: 'w-8 h-8',
	lg: 'w-12 h-12',
	xl: 'w-16 h-16',
	'2xl': 'w-24 h-24',
	'3xl': 'w-32 h-32',
	'4xl': 'w-40 h-40',
	'5xl': 'w-48 h-48',
	'6xl': 'w-56 h-56',
	'7xl': 'w-64 h-64',
	'8xl': 'w-72 h-72'
};
