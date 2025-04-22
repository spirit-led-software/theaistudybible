import type * as React from 'react';
import { useCallback, useEffect, useRef } from 'react';

import { cn } from '@/www/lib/utils';

function Textarea({
  className,
  autoResize,
  maxRows = 5,
  minRows = 1,
  // Remove rows from being spread into textarea
  rows: _rows,
  ...props
}: React.ComponentProps<'textarea'> & {
  autoResize?: boolean;
  maxRows?: number;
  minRows?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Calculate heights based on rows and lineHeight
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(computedStyle.lineHeight || '20');
    const paddingTop = Number.parseFloat(computedStyle.paddingTop || '0');
    const paddingBottom = Number.parseFloat(computedStyle.paddingBottom || '0');
    const padding = paddingTop + paddingBottom;

    const minHeight = lineHeight * minRows + padding;
    const maxHeight = lineHeight * maxRows + padding;

    // Set the height between min and max based on content
    const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight));
    textarea.style.height = `${newHeight}px`;
    textarea.style.minHeight = `${minHeight}px`;
    textarea.style.maxHeight = `${maxHeight}px`;

    // Show scrollbar only when content exceeds maxHeight
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [maxRows, minRows]);

  useEffect(() => {
    if (!autoResize) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    // Initial height adjustment
    adjustHeight();

    // Add event listeners
    textarea.addEventListener('input', adjustHeight);
    textarea.addEventListener('change', adjustHeight);

    // Cleanup
    return () => {
      textarea.removeEventListener('input', adjustHeight);
      textarea.removeEventListener('change', adjustHeight);
    };
  }, [autoResize, adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      data-slot='textarea'
      className={cn(
        'field-sizing-content flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
