<script lang="ts">
	import IndexOperationsDashboard from '$lib/components/admin/IndexOperationsDashboard.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: ({ indexOperations } = data);
</script>

<div class="flex w-full h-full p-5">
	<div class="flex flex-col-reverse w-full overflow-hidden">
		<div class="flex flex-1 w-full overflow-y-scroll">
			<IndexOperationsDashboard initIndexOps={indexOperations} />
		</div>
	</div>
</div>
