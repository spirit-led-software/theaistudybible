<script lang="ts">
	import { enhance } from '$app/forms';
	import type { NeonVectorStoreDocument } from '@core/vector-db/neon';
	import type { ActionData, SubmitFunction } from './$types';

	export let form: ActionData;

	let isLoading = false;
	let alert: { type: 'error' | 'success'; text: string } | undefined = undefined;
	let results: (Omit<NeonVectorStoreDocument, 'embedding'> & { score: number })[] = [];

	const submit: SubmitFunction = async () => {
		isLoading = true;

		return async ({ update }) => {
			isLoading = false;
			await update();
		};
	};

	const examples = [
		'Where did Jesus grow up?',
		'Ephesians 5:33',
		'Who is the Holy Spirit?',
		'What is the meaning of life?',
		'John Calvin',
		"Who is the 'I am' in the Bible?",
		'What does Yahweh mean?'
	];

	$: if (form?.errors?.banner) {
		alert = {
			type: 'error',
			text: form.errors.banner
		};
	}
	$: if (form?.success?.banner) {
		alert = {
			type: 'success',
			text: form.success.banner
		};
	}

	$: if (form?.success?.results && form.success.results.length > 0) {
		results = form.success.results;
	}

	$: if (alert) setTimeout(() => (alert = undefined), 8000);
</script>

<div class="flex flex-col flex-1">
	<div class="flex flex-col w-full h-full p-3 space-y-2 overflow-hidden lg:px-16">
		<form
			use:enhance={submit}
			class="flex flex-col justify-center w-full"
			method="post"
			action="?/search"
		>
			<div class="flex flex-col w-full mb-2">
				<h1 class="text-lg font-medium">Search powered by <span class="text-blue-300">AI</span></h1>
				<p class="text-xs text-gray-400">Find Christian resources using vector similarity search</p>
			</div>
			<div class="join">
				<label
					for="query"
					class="px-3 text-lg text-white border bg-slate-700 join-item label label-text"
				>
					Search:
				</label>
				{#if alert}
					<div class="w-full border join-item">
						<div
							class={`flex justify-center w-full h-full text-center place-items-center ${
								alert.type === 'success' ? 'bg-green-200' : 'bg-red-200'
							}`}
						>
							{alert.text}
						</div>
					</div>
				{:else}
					<input
						type="text"
						id="query"
						name="query"
						placeholder={examples[Math.floor(Math.random() * examples.length)]}
						class="w-full input input-bordered join-item"
						disabled={isLoading}
					/>
				{/if}
				<button type="submit" class="text-white bg-slate-700 btn hover:bg-slate-900 join-item">
					{#if isLoading}
						<span class="loading loading-spinner" />
					{:else}
						<span>Submit</span>
					{/if}
				</button>
			</div>
		</form>
		<div class="flex flex-col w-full h-full overflow-y-scroll border rounded-xl">
			{#if results.length > 0}
				{#each results as result}
					<a
						target="_blank"
						rel="noopener noreferrer"
						href={result.metadata.url}
						class="flex flex-col w-full p-3 border rounded shadow"
					>
						<div class="flex flex-col w-full">
							<div class="text-lg font-bold">{result.metadata.name.split(' - ')[0]}</div>
							<div class="mt-2">
								<h2 class="mb-1 text-sm font-medium">Snippet:</h2>
								<div
									class="w-full text-xs text-gray-500 break-words truncate whitespace-break-spaces max-h-16"
								>
									{result.pageContent.trim()}
								</div>
							</div>
							<div class="flex justify-center w-full mt-3 space-x-1">
								<div class="w-1 h-1 rounded-full bg-slate-700" />
								<div class="w-1 h-1 rounded-full bg-slate-700" />
								<div class="w-1 h-1 rounded-full bg-slate-700" />
							</div>
							<div class="flex justify-between mt-2 place-items-end">
								<div class="flex flex-col">
									<div class="flex space-x-1">
										<div class="text-xs font-medium">Type:</div>
										<div class="text-xs text-gray-500">{result.metadata.type}</div>
									</div>
									<div class="flex space-x-2">
										{#if result.metadata?.loc?.pageNumber}
											<div class="flex space-x-1">
												<div class="text-xs font-medium">Page Number:</div>
												<div class="text-xs text-gray-500">{result.metadata.loc.pageNumber}</div>
											</div>
										{/if}
										{#if result.metadata?.loc?.lines && result.metadata.type !== 'Webpage'}
											<div class="flex space-x-1">
												<div class="text-xs font-medium">Lines:</div>
												<div class="text-xs text-gray-500">
													{result.metadata.loc.lines.from}-{result.metadata.loc.lines.to}
												</div>
											</div>
										{/if}
									</div>
								</div>
								<div class="flex space-x-1">
									<div class="text-xs font-medium">Similarity Score:</div>
									<div class="text-xs text-gray-500">{((1.0 - result.score) * 100).toFixed(2)}</div>
								</div>
							</div>
						</div>
					</a>
				{/each}
			{:else}
				<div class="flex flex-col justify-center w-full h-full place-items-center">
					<div class="text-lg font-medium">No Results Yet.</div>
				</div>
			{/if}
		</div>
	</div>
</div>
