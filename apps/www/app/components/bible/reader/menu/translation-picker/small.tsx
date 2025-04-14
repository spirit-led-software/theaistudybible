import {
  type SmallBiblePickerProps,
  SmallBiblePicker as SmallTranslationPickerComponent,
} from '@/www/components/bible/small-bible-picker';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { useNavigate } from '@tanstack/react-router';

export type SmallTranslationPickerProps = Omit<SmallBiblePickerProps, 'value' | 'onValueChange'>;

export function SmallTranslationPicker(props: SmallTranslationPickerProps) {
  const navigate = useNavigate();
  const bible = useBibleReaderStore((s) => s.bible);

  return (
    <SmallTranslationPickerComponent
      value={bible}
      onValueChange={(b) => {
        if (b) navigate({ to: `/bible/${b.abbreviation}` });
      }}
      {...props}
    />
  );
}
