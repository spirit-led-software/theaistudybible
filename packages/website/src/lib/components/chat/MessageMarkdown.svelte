<script lang="ts">
	import { marked } from 'marked';

	export let content: string;
</script>

<div class="flex flex-col w-full">
	{@html marked(content.trim(), {
		hooks: {
			preprocess: (src) => {
				src = src.replace(/<a href=/g, '<a target="_blank" href=');
				return src;
			},
			postprocess: (src) => {
				src = src.replace(/<h1/g, '<h1 class="mb-4 text-xl font-bold"');
				src = src.replace(/<h2/g, '<h2 class="mb-2 text-lg font-bold"');
				src = src.replace(/<h3/g, '<h3 class="mb-2 text-lg font-medium"');
				src = src.replace(/<h4/g, '<h4 class="mb-2 font-medium"');
				src = src.replace(/<ol/g, '<ol class="mb-2 text-xs list-decimal list-outside"');
				src = src.replace(/<ul/g, '<ul class="mb-2 text-xs list-disc list-outside"');
				src = src.replace(/<a/g, '<a class="text-blue-400 link"');
				src = src.replace(/<p/g, '<p class="mb-2 text-sm"');
				src = src.replace(/<img/g, '<img class="w-full"');
				src = src.replace(/<table/g, '<table class="table whitespace-normal table-xs"');
				return src;
			}
		}
	})}
</div>
