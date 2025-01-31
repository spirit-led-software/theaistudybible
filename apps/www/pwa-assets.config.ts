import {
  createAppleSplashScreens,
  defineConfig,
  minimal2023Preset,
} from '@vite-pwa/assets-generator/config';

export default defineConfig({
  headLinkOptions: {
    basePath: '/',
    preset: '2023',
  },
  preset: {
    ...minimal2023Preset,
    maskable: {
      ...minimal2023Preset.maskable,
      resizeOptions: {
        ...minimal2023Preset.maskable.resizeOptions,
        fit: 'contain',
        background: '#030527',
      },
    },
    apple: {
      ...minimal2023Preset.apple,
      resizeOptions: {
        ...minimal2023Preset.apple.resizeOptions,
        fit: 'contain',
        background: '#030527',
      },
    },
    assetName: (type, size) => {
      switch (type) {
        case 'transparent': {
          return `pwa/${size.width}x${size.height}.png`;
        }
        case 'maskable': {
          return `maskable-icon-${size.width}x${size.height}.png`;
        }
        case 'apple': {
          return `apple-touch-icon-${size.width}x${size.height}.png`;
        }
      }
    },
    appleSplashScreens: createAppleSplashScreens({
      padding: 0.5,
      resizeOptions: {
        background: 'white',
        fit: 'contain',
      },
      darkResizeOptions: {
        background: '#030527',
        fit: 'contain',
      },
      name: (landscape, size, dark) => {
        return `pwa/apple-splash/${landscape ? 'landscape' : 'portrait'}-${typeof dark === 'boolean' ? (dark ? 'dark-' : 'light-') : ''}${size.width}x${size.height}.png`;
      },
    }),
  },
  images: ['public/icon.svg'],
});
