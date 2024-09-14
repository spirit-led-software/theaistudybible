// @refresh reload
import { createHandler, StartServer } from '@solidjs/start/server';

export default createHandler(
  () => (
    <StartServer
      document={({ assets, children, scripts }) => (
        <html lang='en'>
          <head>
            <meta charset='utf-8' />
            <meta name='viewport' content='width=device-width, initial-scale=1' />
            <title>The AI Study Bible</title>
            <meta
              name='description'
              content='The AI Study Bible is a digital study Bible that uses artificial intelligence to help you study the Bible.'
            />
            <meta name='theme-color' content='#030527' />
            <link rel='icon' href='/favicon.ico' sizes='48x48' />
            <link rel='icon' href='/icon.svg' type='image/svg+xml' sizes='any' />
            <link rel='apple-touch-icon' href='/apple-touch-icon-180x180.png' />
            {assets}
          </head>
          <body>
            <div id='app'>{children}</div>
            {scripts}
          </body>
        </html>
      )}
    />
  ),
  { mode: 'stream' },
);
