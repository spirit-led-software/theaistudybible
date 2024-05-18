<script lang="ts">
  /* eslint-disable svelte/no-at-html-tags */

  import { marked } from 'marked';

  marked.use({
    renderer: {
      heading(text, level) {
        switch (level) {
          case 1:
            return `<h1 class="mb-4 text-lg font-extrabold">${text}</h1>`;
          case 2:
            return `<h2 class="mb-2 text-lg font-bold">${text}</h2>`;
          case 3:
            return `<h3 class="mb-2 text-lg font-medium">${text}</h3>`;
          case 4:
            return `<h4 class="mb-2 text-base font-medium">${text}</h4>`;
          default:
            return `<h${level} class="mb-1 text-base font-medium">${text}</h${level}>`;
        }
      },
      list(body, ordered) {
        if (ordered) {
          return `<ol class="mb-2 text-sm list-decimal list-outside">${body}</ol>`;
        }
        return `<ul class="mb-2 text-sm list-disc list-outside">${body}</ul>`;
      },
      listitem(text, task, checked) {
        if (task) {
          return `<li class="flex items-center mb-2 text-sm"><input type="checkbox" class="mr-2" ${
            checked ? 'checked' : ''
          } disabled>${text}</li>`;
        }
        return `<li class="mb-2 text-sm">${text}</li>`;
      },
      link(href, title, text) {
        return `<a class="text-blue-400 link" target="_blank" href="${href}" title="${title}">${text}</a>`;
      },
      image(href, title, text) {
        return `<img src="${href}" alt="${text}" title="${title}" class="w-full"`;
      },
      table(header, body) {
        return `<table class="table whitespace-normal table-xs"><thead>${header}</thead><tbody>${body}</tbody></table>`;
      },
      blockquote(quote) {
        return `<blockquote class="mb-2 text-sm">${quote}</blockquote>`;
      },
      checkbox(checked) {
        return `<input type="checkbox" class="mr-2" ${checked ? 'checked' : ''} disabled>`;
      },
      paragraph(text) {
        return `<p class="mb-2 text-sm">${text}</p>`;
      },
      strong(text) {
        return `<strong class="font-bold">${text}</strong>`;
      },
      code(code, infostring, escaped) {
        if (infostring) {
          const lang = infostring.split(/\s+/g)[0];
          return `<pre class="mb-2 text-sm"><code class="language-${lang}">${
            escaped ? code : escape(code)
          }</code></pre>`;
        }
        return `<pre class="mb-2 text-sm"><code>${escaped ? code : escape(code)}</code></pre>`;
      }
    }
  });

  export let content: string;
</script>

<div class="flex w-full flex-col pl-2">
  {@html marked.parse(content.trim())}
</div>
