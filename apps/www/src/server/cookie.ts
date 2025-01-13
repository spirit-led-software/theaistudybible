import { COLOR_MODE_STORAGE_KEY } from '@kobalte/core';
import { getCookie } from 'vinxi/http';

export const getColorModeCookie = () => {
  'use server';
  const colorMode = getCookie(COLOR_MODE_STORAGE_KEY);
  return { cookie: colorMode ? `${COLOR_MODE_STORAGE_KEY}=${colorMode}` : '' };
};
