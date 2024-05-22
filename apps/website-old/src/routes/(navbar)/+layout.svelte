<script lang="ts">
  import Footer from '$lib/components/Footer.svelte';
  import NavBar from '$lib/components/NavBar.svelte';
  import type { LayoutData } from './$types';

  export let data: LayoutData;
</script>

<div class="flex h-screen flex-col">
  <NavBar user={data.user} />
  <slot />
</div>
<Footer />
