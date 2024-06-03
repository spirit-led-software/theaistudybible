<script lang="ts">
  import { A } from '$lib/components/ui/typeography';
  import type { RpcClient } from '$lib/types/rpc';
  import { cn } from '$lib/utils';
  import type { TextContent } from '@theaistudybible/core/types/bible';
  import type { InferResponseType } from 'hono/client';

  type Props = {
    content: TextContent;
    style: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attrs: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: any;
    class?: string;
    bible: InferResponseType<RpcClient['bibles'][':id']['$get']>['data'];
  };

  let { content, style, attrs, props, class: className, bible }: Props = $props();

  let { loc } = $derived(attrs);
  let [bookAbbr, chapterAndVerse] = $derived(loc.split(' '));
  let [chapter, verse] = $derived(chapterAndVerse.split(':'));
  let link = $derived(() => {
    let link = `/bible/${bible.abbreviation}/${bookAbbr}/${chapter}`;
    if (verse) {
      link += `/${verse}`;
    }
    return link;
  });
</script>

<A
  id={content.id}
  data-type={content.type}
  data-verse-id={content.verseId}
  data-verse-number={content.verseNumber}
  {...props}
  className={cn(style, `hover:underline`, className)}
  href={link}
>
  {content.text}
</A>
