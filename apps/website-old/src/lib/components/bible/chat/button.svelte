<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { useBibleStore } from '$lib/runes/bible.svelte';
  import { MessageSquare } from 'lucide-svelte';

  const { chatOpen, setChatOpen } = useBibleStore();
</script>

<Button
  class={`mx-auto h-12 w-20 rounded-t-2xl transition duration-200 ${chatOpen ? 'translate-y-full' : 'delay-200'}`}
  onclick={() => setChatOpen(!chatOpen)}
>
  <MessageSquare size={20} />
</Button>
