<script lang="ts">
	import IndexOperationsDashboard from '$lib/components/admin/IndexOperationsDashboard.svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	$: ({ indexOperations } = data);
</script>

<div class="flex flex-col-reverse w-full overflow-hidden">
	<div class="flex w-full mt-5">
		<slot />
	</div>
	<div class="flex flex-1 w-full overflow-y-scroll">
		<IndexOperationsDashboard initIndexOps={indexOperations} />
	</div>
</div>
