import { createAsync } from '@solidjs/router';
import {
  protect,
  protectAdmin,
  protectAnonymous,
  protectFree,
  protectNotFree,
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

export const useProtectNotFree = (redirectUrl?: string) => {
  return createAsync(() => protectNotFree(redirectUrl));
};

export const useProtectFree = (redirectUrl?: string) => {
  return createAsync(() => protectFree(redirectUrl));
};
