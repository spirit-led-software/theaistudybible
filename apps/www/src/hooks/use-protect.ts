import { createAsync } from '@solidjs/router';
import {} from 'solid-js';
import {
  protect,
  protectAdmin,
  protectAnonymous,
  protectNotPro,
  protectPro,
} from '../server/functions/auth';

export const useProtect = (redirectUrl?: string) => {
  return createAsync(() => protect(redirectUrl));
};

export const useProtectAnonymous = (redirectUrl?: string) => {
  return createAsync(() => protectAnonymous(redirectUrl));
};

export const useProtectAdmin = (redirectUrl?: string) => {
  return createAsync(() => protectAdmin(redirectUrl));
};

export const useProtectPro = (redirectUrl?: string) => {
  return createAsync(() => protectPro(redirectUrl));
};

export const useProtectNotPro = (redirectUrl?: string) => {
  return createAsync(() => protectNotPro(redirectUrl));
};
