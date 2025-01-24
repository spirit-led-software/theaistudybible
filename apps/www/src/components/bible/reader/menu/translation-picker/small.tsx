import { SmallBiblePicker as SmallTranslationPickerComponent } from '@/www/components/bible/small-bible-picker';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { useNavigate } from '@solidjs/router';

export function SmallTranslationPicker() {
  const navigate = useNavigate();
  const [brStore] = useBibleReaderStore();

  return (
    <SmallTranslationPickerComponent
      value={brStore.bible}
      onValueChange={(b) => {
        if (b) navigate(`/bible/${b.abbreviation}`);
      }}
    />
  );
}
