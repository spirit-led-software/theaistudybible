import { Button } from '@/www/components/ui/button';
import { TextField, TextFieldInput, TextFieldLabel } from '@/www/components/ui/text-field';
import { ToggleGroupItem } from '@/www/components/ui/toggle-group';
import { ColorPicker } from '@ark-ui/solid';
import { PipetteIcon } from 'lucide-solid';
import type { Setter } from 'solid-js';

export type HighlightColorPickerProps = {
  setColor: Setter<string | undefined>;
};

export const HighlightColorPicker = (props: HighlightColorPickerProps) => {
  return (
    <ColorPicker.Root
      defaultValue='#FFFd70'
      onValueChange={(details) => props.setColor(details.value.toString('hex'))}
    >
      <ColorPicker.Context>
        {(api) => (
          <>
            <ColorPicker.Control class='flex items-center justify-start'>
              <ColorPicker.Trigger
                asChild={(props) => (
                  <ToggleGroupItem
                    {...props()}
                    value='custom'
                    class='flex w-full justify-center sm:justify-start'
                  >
                    <span class='flex items-center space-x-2'>
                      <ColorPicker.Swatch value={api().value} class='h-4 w-4 rounded-full' />
                      <span class='hidden sm:flex'>Custom</span>
                    </span>
                  </ToggleGroupItem>
                )}
              />
            </ColorPicker.Control>
            <ColorPicker.Positioner>
              <ColorPicker.Content
                class='bg-background rounded-md p-4 shadow-md'
                data-corvu-no-drag // Prevent dragging the color picker
              >
                <div class='flex flex-col gap-3'>
                  <ColorPicker.Area class='h-52 w-full rounded-sm'>
                    <ColorPicker.AreaBackground class='h-full w-full rounded-sm' />
                    <ColorPicker.AreaThumb class='h-4 w-4 rounded-full shadow-sm outline outline-white' />
                  </ColorPicker.Area>
                  <div class='flex gap-1.5'>
                    <ColorPicker.EyeDropperTrigger
                      asChild={(props) => (
                        <Button {...props()} size='sm' variant='outline' aria-label='Pick a color'>
                          <PipetteIcon />
                        </Button>
                      )}
                    />
                    <div class='flex flex-1 flex-col gap-2'>
                      <ColorPicker.ChannelSlider channel='hue' class='flex w-full'>
                        <ColorPicker.ChannelSliderTrack class='h-2 w-full rounded-lg' />
                        <ColorPicker.ChannelSliderThumb class='h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-sm outline outline-white' />
                      </ColorPicker.ChannelSlider>
                      <ColorPicker.ChannelSlider channel='alpha' class='flex w-full'>
                        <ColorPicker.TransparencyGrid size='8px' />
                        <ColorPicker.ChannelSliderTrack class='h-2 w-full rounded-lg' />
                        <ColorPicker.ChannelSliderThumb class='h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-sm outline outline-white' />
                      </ColorPicker.ChannelSlider>
                    </div>
                  </div>
                  <div class='flex gap-1'>
                    <ColorPicker.ChannelInput
                      channel='hex'
                      asChild={(props) => (
                        <TextField class='w-1/2'>
                          <TextFieldLabel>Hex</TextFieldLabel>
                          <TextFieldInput type='text' {...props()} />
                        </TextField>
                      )}
                    />
                    <ColorPicker.ChannelInput
                      channel='alpha'
                      asChild={(props) => (
                        <TextField class='flex-1'>
                          <TextFieldLabel>Alpha</TextFieldLabel>
                          <TextFieldInput type='number' {...props()} />
                        </TextField>
                      )}
                    />
                  </div>
                </div>
              </ColorPicker.Content>
            </ColorPicker.Positioner>
          </>
        )}
      </ColorPicker.Context>
    </ColorPicker.Root>
  );
};
