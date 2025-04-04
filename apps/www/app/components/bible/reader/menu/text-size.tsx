import { DropdownMenuItem } from '@/www/components/ui/dropdown-menu';
import { Label } from '@/www/components/ui/label';
import { Slider } from '@/www/components/ui/slider';
import { type BibleReaderTextSize, useBibleReaderStore } from '@/www/contexts/bible-reader';

const numberToTextSizeMap: Record<number, string> = {
  1: 'xs',
  2: 'sm',
  3: 'md',
  4: 'lg',
  5: 'xl',
  6: '2xl',
  7: '3xl',
  8: '4xl',
};

const textSizeToNumberMap: Record<string, number> = {
  xs: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 5,
  '2xl': 6,
  '3xl': 7,
  '4xl': 8,
};

export const TextSizeMenuItem = () => {
  const brStore = useBibleReaderStore((state) => ({
    textSize: state.textSize,
    setTextSize: state.setTextSize,
  }));

  return (
    <DropdownMenuItem>
      <Label>Text Size: {brStore.textSize}</Label>
      <Slider
        value={[textSizeToNumberMap[brStore.textSize ?? 'md']]}
        onValueChange={(value) => {
          brStore.setTextSize(numberToTextSizeMap[value[0]] as BibleReaderTextSize);
        }}
        min={1}
        max={Object.keys(numberToTextSizeMap).length}
        step={1}
        defaultValue={[textSizeToNumberMap[brStore.textSize ?? 'md']]}
        className='w-[200px] space-y-3'
      />
    </DropdownMenuItem>
  );
};
