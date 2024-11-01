'use server';

import { COLOR_MODE_STORAGE_KEY } from '@kobalte/core';
import { getCookie, setCookie } from 'vinxi/http';

export const getColorModeCookie = () => {
  let colorMode = getCookie(COLOR_MODE_STORAGE_KEY);
  if (!colorMode) {
    colorMode = 'system';
    setCookie(COLOR_MODE_STORAGE_KEY, colorMode);
  }
  return `${COLOR_MODE_STORAGE_KEY}=${colorMode}`;
};
