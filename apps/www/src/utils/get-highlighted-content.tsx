export const getHighlightedContent = (content: string, query: string, truncateAt?: number) => {
  if (!query || !content.toLowerCase().includes(query.toLowerCase())) {
    return content;
  }

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (truncateAt) {
    const matchIndex = content.toLowerCase().indexOf(query.toLowerCase());
    const remainingChars = Math.max(truncateAt - query.length, truncateAt / 2);
    const charsEachSide = Math.floor(remainingChars / 2);

    const start = Math.max(0, matchIndex - charsEachSide);
    const end = Math.min(content.length, matchIndex + query.length + charsEachSide);
    const excerpt =
      (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '');

    return (
      <span class='inline'>
        {excerpt
          .split(new RegExp(`(${escapedQuery})`, 'gi'))
          .map((part) =>
            part.toLowerCase() === query.toLowerCase() ? (
              <span class='inline bg-yellow-200/50 dark:bg-yellow-500/30'>{part}</span>
            ) : (
              part
            ),
          )}
      </span>
    );
  }
  return (
    <span class='inline'>
      {content
        .split(new RegExp(`(${escapedQuery})`, 'gi'))
        .map((part) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span class='inline bg-yellow-200/50 dark:bg-yellow-500/30'>{part}</span>
          ) : (
            part
          ),
        )}
    </span>
  );
};
