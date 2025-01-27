import { DropdownMenuItem } from '@/www/components/ui/dropdown-menu';
import {
  Slider,
  SliderFill,
  SliderLabel,
  SliderThumb,
  SliderTrack,
  SliderValueLabel,
} from '@/www/components/ui/slider';
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
  const [brStore, setBrStore] = useBibleReaderStore();

  return (
    <DropdownMenuItem>
      <Slider
        value={[textSizeToNumberMap[brStore.textSize ?? 'md']]}
        onChange={(value) => {
          setBrStore('textSize', numberToTextSizeMap[value[0]] as BibleReaderTextSize);
        }}
        minValue={1}
        maxValue={Object.keys(numberToTextSizeMap).length}
        step={1}
        defaultValue={[textSizeToNumberMap[brStore.textSize ?? 'md']]}
        getValueLabel={(params) => numberToTextSizeMap[params.values[0]]}
        class='w-[200px] space-y-3'
      >
        <div class='flex w-full justify-between'>
          <SliderLabel>Text Size</SliderLabel>
          <SliderValueLabel />
        </div>
        <SliderTrack>
          <SliderFill />
          <SliderThumb />
          <SliderThumb />
        </SliderTrack>
      </Slider>
    </DropdownMenuItem>
  );
};
