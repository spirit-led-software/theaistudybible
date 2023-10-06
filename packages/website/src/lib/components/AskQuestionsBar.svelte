<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';

	const potentialQuestions = [
		'Why does Jesus love me?',
		'What does John 3:16 say?',
		'How does Jesus offer salvation?',
		'Can you summarize the gospel?',
		'Explain the gospel to me.',
		'What is the gospel?',
		'What is the gospel of Jesus Christ?',
		'What is the gospel message?',
		'Who is the apostle Paul?',
		'When was Jesus born?',
		'Explain the trinity to me.',
		'What is the trinity?',
		'What does it mean to be a triune God?',
		'Can you find me bible verse about joy?'
	];

	let input = '';

	const handleAskQuestion = async (query: string) => {
		try {
			if (query) {
				await goto(`/chat?query=${query}`);
			} else {
				await goto('/chat');
			}
		} catch (error) {
			console.error(error);
			throw error;
		}
	};
</script>

<form
	class="flex flex-col w-full space-y-1"
	on:submit|preventDefault={() => handleAskQuestion(input)}
>
	<label for="question-bar" class="text-sm text-gray-400">Ask a question</label>
	<div class="flex w-full space-x-0">
		<input
			id="question-bar"
			bind:value={input}
			type="text"
			class="w-full px-2 py-1 border rounded-lg rounded-r-none focus:outline-none focus:border-slate-800 border-slate-300"
			placeholder={potentialQuestions[Math.floor(Math.random() * potentialQuestions.length)]}
		/>
		<button
			type="submit"
			class="px-2 py-1 font-medium border rounded-lg rounded-l-none border-slate-300 hover:bg-slate-100"
		>
			<Icon icon="formkit:arrowright" height={20} width={20} />
		</button>
	</div>
</form>
