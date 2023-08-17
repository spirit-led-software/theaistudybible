<script lang="ts">
	import { squareDimensionClasses, type ComponentSize } from '$lib/utils/sizing';
	import type { UserWithRoles } from '@core/model';

	export let size: ComponentSize = 'md';
	export let largeSize: ComponentSize = 'md';
	let className: string | undefined = undefined;
	export { className as class };
	export let user: UserWithRoles;

	const dimensions = squareDimensionClasses[size];
	const largeDimensions = squareDimensionClasses[largeSize];
</script>

<div
	class={`relative rounded-full bg-gray-300 ${dimensions} lg:${largeDimensions} ${className ?? ''}`}
>
	<div
		class={`absolute inset-0 flex items-center justify-center rounded-full text-white text-xl font-bold uppercase`}
	>
		{user?.name ? user.name[0] : user?.email ? user.email[0] : '?'}
	</div>
</div>
