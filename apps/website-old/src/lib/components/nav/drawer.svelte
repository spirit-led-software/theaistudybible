<script lang="ts">
  import { MenuIcon, X } from 'lucide-svelte';
  import Logo from '../branding/logo.svelte';
  import { Button } from '../ui/button';
  import * as Drawer from '../ui/drawer';
</script>

<Drawer.Root direction="left">
  <Drawer.Trigger asChild>
    <Button variant={'ghost'}>
      <MenuIcon size={24} />
    </Button>
  </Drawer.Trigger>
  <Drawer.Content>
    <div class="relative h-dvh w-full">
      <Drawer.Close class="absolute right-5 top-5">
        <X size={20} />
      </Drawer.Close>
      <Drawer.Header>
        <Drawer.Title>
          <a href="/">
            <Logo width={300} height={100} />
          </a>
        </Drawer.Title>
      </Drawer.Header>
    </div>
  </Drawer.Content>
</Drawer.Root>
