import { ToggleGroupItem } from '@/www/components/ui/toggle-group';

export type ColorItemProps = {
  title: string;
  hex: string;
};

export const ColorItem = (props: ColorItemProps) => {
  return (
    <ToggleGroupItem value={props.hex} class='flex justify-center sm:justify-start'>
      <span class='flex items-center space-x-2'>
        <span
          class={'size-4 rounded-full'}
          style={{
            'background-color': props.hex,
          }}
        />
        <span class='hidden sm:flex'>{props.title}</span>
      </span>
    </ToggleGroupItem>
  );
};
