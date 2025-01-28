import {
  type SmallBiblePickerProps,
  SmallBiblePicker as SmallTranslationPickerComponent,
} from '@/www/components/bible/small-bible-picker';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { useNavigate } from '@solidjs/router';

export type SmallTranslationPickerProps = Omit<SmallBiblePickerProps, 'value' | 'onValueChange'>;

export function SmallTranslationPicker(props: SmallTranslationPickerProps) {
  const navigate = useNavigate();
  const [brStore] = useBibleReaderStore();

  return (
    <SmallTranslationPickerComponent
      value={brStore.bible}
      onValueChange={(b) => {
        if (b) navigate(`/bible/${b.abbreviation}`);
      }}
      {...props}
    />
  );
}
