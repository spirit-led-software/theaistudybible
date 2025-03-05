import { ToggleGroupItem } from '@/www/components/ui/toggle-group';

export type ColorItemProps = {
  title: string;
  hex: string;
};

export const ColorItem = (props: ColorItemProps) => {
  return (
    <ToggleGroupItem value={props.hex} className='flex justify-center sm:justify-start'>
      <span className='flex items-center space-x-2'>
        <span
          className={'size-4 rounded-full'}
          style={{
            backgroundColor: props.hex,
          }}
        />
        <span className='hidden sm:flex'>{props.title}</span>
      </span>
    </ToggleGroupItem>
  );
};
