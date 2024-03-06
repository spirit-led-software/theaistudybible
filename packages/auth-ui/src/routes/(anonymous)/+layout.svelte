<script lang="ts">
  import Logo from '$lib/components/branding/Logo.svelte';
</script>

<div
  class="flex h-full place-content-center place-items-center bg-gradient-to-b from-slate-950 to-slate-600 lg:place-content-end lg:place-items-end"
>
  <div class="hidden h-full flex-1 place-items-center justify-center lg:visible lg:flex">
    <div class="flex w-full flex-col place-items-center justify-center space-y-4">
      <div class="flex w-3/4 flex-col place-items-center justify-center">
        <Logo size={'8xl'} colorscheme={'light'} />
      </div>
    </div>
  </div>
  <slot />
</div>
