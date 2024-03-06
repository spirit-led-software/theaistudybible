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
  class="flex w-full flex-col space-y-1"
  on:submit|preventDefault={() => handleAskQuestion(input)}
>
  <label for="question-bar" class="text-sm text-gray-200">Ask a question</label>
  <div class="flex w-full space-x-0">
    <input
      id="question-bar"
      bind:value={input}
      type="text"
      class="w-full rounded-lg rounded-r-none border border-slate-300 px-2 py-1 text-slate-900 focus:border-slate-800 focus:outline-none lg:px-4 lg:py-2"
      placeholder={potentialQuestions[Math.floor(Math.random() * potentialQuestions.length)]}
    />
    <button
      type="submit"
      class="rounded-lg rounded-l-none border border-slate-300 bg-white px-2 py-1 font-medium hover:bg-gray-200 lg:px-4 lg:py-2"
    >
      <Icon icon="formkit:arrowright" height={20} width={20} class="text-slate-800" />
    </button>
  </div>
</form>
