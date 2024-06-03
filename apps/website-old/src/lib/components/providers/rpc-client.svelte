<script lang="ts">
  import type { RpcClient } from '$lib/types/rpc';
  import { setContext, type Snippet } from 'svelte';

  type Props = {
    client: RpcClient;
    children: Snippet;
  };

  let { client, children }: Props = $props();

  setContext('$$_rpcClient', client);
</script>

{@render children()}
