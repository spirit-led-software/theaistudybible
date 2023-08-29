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

export const textSizeClasses = {
	'3xs': 'text-3xs',
	'2xs': 'text-2xs',
	xs: 'text-xs',
	sm: 'text-sm',
	md: 'text-md',
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

export const squareDimensions = {
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

export const squareDimensionClasses = {
	'3xs': `w-${squareDimensions['3xs']} h-${squareDimensions['3xs']}`,
	'2xs': `w-${squareDimensions['2xs']} h-${squareDimensions['2xs']}`,
	xs: `w-${squareDimensions.xs} h-${squareDimensions.xs}`,
	sm: `w-${squareDimensions.sm} h-${squareDimensions.sm}`,
	md: `w-${squareDimensions.md} h-${squareDimensions.md}`,
	lg: `w-${squareDimensions.lg} h-${squareDimensions.lg}`,
	xl: `w-${squareDimensions.xl} h-${squareDimensions.xl}`,
	'2xl': `w-${squareDimensions['2xl']} h-${squareDimensions['2xl']}`,
	'3xl': `w-${squareDimensions['3xl']} h-${squareDimensions['3xl']}`,
	'4xl': `w-${squareDimensions['4xl']} h-${squareDimensions['4xl']}`,
	'5xl': `w-${squareDimensions['5xl']} h-${squareDimensions['5xl']}`,
	'6xl': `w-${squareDimensions['6xl']} h-${squareDimensions['6xl']}`,
	'7xl': `w-${squareDimensions['7xl']} h-${squareDimensions['7xl']}`,
	'8xl': `w-${squareDimensions['8xl']} h-${squareDimensions['8xl']}`
};
