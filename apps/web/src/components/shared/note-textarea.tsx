'use client';

import React, { useLayoutEffect, useRef } from 'react';
import { Textarea } from '../ui/textarea';

type NoteTextareaProps = Pick<React.ComponentProps<typeof Textarea>, 'aria-label' | 'disabled' | 'name' | 'onChange' | 'placeholder' | 'value'>;

export function NoteTextarea(props: NoteTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 192)}px`;
  }, [props.value]);

  return (
    <Textarea
      {...props}
      ref={ref}
      rows={2}
      wrap="soft"
      className="max-h-48 min-h-16 min-w-0 flex-1 resize-y break-words border-0 bg-transparent px-0 py-1 text-sm shadow-none focus-visible:ring-0"
    />
  );
}
