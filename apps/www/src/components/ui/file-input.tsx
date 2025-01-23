import { cn } from '@/www/lib/utils';
import type { PolymorphicProps } from '@kobalte/core';
import type { ComponentProps, JSX, ValidComponent } from 'solid-js';
import {
  createContext,
  createMemo,
  createSignal,
  onCleanup,
  splitProps,
  useContext,
} from 'solid-js';
import { Show } from 'solid-js';
import type { ButtonProps } from './button';
import { Button } from './button';

type FileInputProps<T extends ValidComponent = 'div'> = PolymorphicProps<
  T,
  {
    class?: string;
    children: JSX.Element;
    value?: FileList | null;
    onChange?: (files: FileList | null) => void;
  }
>;

const FileInput = <T extends ValidComponent = 'div'>(props: FileInputProps<T>) => {
  const [internalFiles, setInternalFiles] = createSignal<FileList | null>(null);
  const [isDragging, setIsDragging] = createSignal(false);
  let dragCounter = 0;
  let timeout: number | undefined;

  const files = createMemo(() => props.value ?? internalFiles());
  const setFiles = (newFiles: FileList | null) => {
    if (props.onChange) {
      props.onChange(newFiles);
    } else {
      setInternalFiles(newFiles);
    }
  };

  const handleDragEnter = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounter++;
    if (dragCounter === 1) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounter--;
    if (dragCounter === 0) {
      clearTimeout(timeout);
      timeout = window.setTimeout(() => setIsDragging(false), 100);
    }
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    dragCounter = 0;

    const newFiles = event.dataTransfer?.files;
    if (newFiles && newFiles.length > 0) {
      setFiles(newFiles);
    }
  };

  onCleanup(() => {
    clearTimeout(timeout);
  });

  const [local, others] = splitProps(props, ['class', 'children', 'value', 'onChange']);

  return (
    <FileInputContext.Provider value={{ files, setFiles, isDragging }}>
      <div
        class={cn('relative flex flex-col gap-2', local.class)}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        {...others}
      >
        {local.children}
      </div>
    </FileInputContext.Provider>
  );
};

type FileInputContextValue = {
  files: () => FileList | null;
  setFiles: (files: FileList | null) => void;
  isDragging: () => boolean;
};

const FileInputContext = createContext<FileInputContextValue>();

const useFileInput = () => {
  const context = useContext(FileInputContext);
  if (!context) {
    throw new Error('useFileInput must be used within a FileInput component');
  }
  return context;
};

type FileInputRootProps<T extends ValidComponent = 'div'> = PolymorphicProps<
  T,
  {
    class?: string;
  }
>;

const FileInputRoot = <T extends ValidComponent = 'div'>(props: FileInputRootProps<T>) => {
  const [local, others] = splitProps(props, ['class']);
  return <div class={cn('relative flex flex-col gap-2', local.class)} {...others} />;
};

type FileInputTriggerProps = ButtonProps & {
  class?: string;
  children?: JSX.Element;
};

const FileInputTrigger = (props: FileInputTriggerProps) => {
  const { files } = useFileInput();
  const [local, others] = splitProps(props, ['class', 'children']);

  return (
    <Button
      variant='outline'
      class={cn(
        'w-full justify-start text-left font-normal',
        !files() && 'text-muted-foreground',
        local.class,
      )}
      onClick={() => document.getElementById('file-input')?.click()}
      {...others}
    >
      <Show when={files()} fallback={local.children || 'Select file or drag and drop'}>
        {`${files()!.length} file(s) selected`}
      </Show>
    </Button>
  );
};

type FileInputInputProps = Omit<ComponentProps<'input'>, 'children' | 'type'>;

const FileInputInput = (props: FileInputInputProps) => {
  const { setFiles } = useFileInput();
  const [local, others] = splitProps(props, ['class', 'onChange']);

  const handleChange: JSX.ChangeEventHandlerUnion<HTMLInputElement, Event> = (event) => {
    const input = event.target;
    setFiles(input.files);
    if (local.onChange && typeof local.onChange === 'function') {
      local.onChange(event);
    }
  };

  return (
    <input
      id='file-input'
      type='file'
      class={cn('hidden', local.class)}
      onChange={handleChange}
      {...others}
    />
  );
};

type FileInputDropAreaProps = {
  class?: string;
  children?: JSX.Element;
};

const FileInputDropArea = (props: FileInputDropAreaProps) => {
  const { isDragging } = useFileInput();
  const [local, others] = splitProps(props, ['class', 'children']);

  return (
    <Show when={isDragging()}>
      <div
        class={cn(
          'absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs transition-opacity duration-300',
          local.class,
        )}
        {...others}
      >
        {local.children || <p class='text-lg text-muted-foreground'>Drop files here</p>}
      </div>
    </Show>
  );
};

type FileInputDescriptionProps = JSX.HTMLAttributes<HTMLParagraphElement>;

const FileInputDescription = (props: FileInputDescriptionProps) => {
  const [local, others] = splitProps(props, ['class']);
  return <p class={cn('text-muted-foreground text-sm', local.class)} {...others} />;
};

type FileInputErrorMessageProps = JSX.HTMLAttributes<HTMLParagraphElement>;

const FileInputErrorMessage = (props: FileInputErrorMessageProps) => {
  const [local, others] = splitProps(props, ['class']);
  return <p class={cn('font-medium text-destructive text-sm', local.class)} {...others} />;
};

export {
  FileInput,
  FileInputDescription,
  FileInputDropArea,
  FileInputErrorMessage,
  FileInputInput,
  FileInputRoot,
  FileInputTrigger,
};
