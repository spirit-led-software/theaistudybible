// @refresh reload

import { StartClient, mount } from '@solidjs/start/client';
import { initSentry } from './utils/sentry';

initSentry();

mount(() => <StartClient />, document.getElementById('app')!);
