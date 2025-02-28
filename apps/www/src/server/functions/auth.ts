import { query, redirect } from '@solidjs/router';
import { auth } from '../utils/auth';
import { getProSubscription } from './pro';

/**
 * Protects the route from being accessed by unauthenticated users.
 * @param redirectUrl - The URL to redirect to if the user is unauthenticated. Defaults to '/sign-in'.
 */
export const protect = query((redirectUrl?: string) => {
  'use server';
  const { session, user } = auth();
  if (!session || !user) {
    return redirect(redirectUrl ?? '/sign-in');
  }
  return Promise.resolve({ success: true });
}, 'protect');

/**
 * Protects the route from being accessed by authenticated users.
 * @param redirectUrl - The URL to redirect to if the user is authenticated. Defaults to '/'.
 */
export const protectAnonymous = query((redirectUrl?: string) => {
  'use server';
  const { session, user } = auth();
  if (session && user) {
    return redirect(redirectUrl ?? '/');
  }
  return Promise.resolve({ success: true });
}, 'protect-anonymous');

/**
 * Protects the route from being accessed by non-admin users.
 * @param redirectUrl - The URL to redirect to if the user is not an admin. Defaults to '/'.
 */
export const protectAdmin = query((redirectUrl?: string) => {
  'use server';
  const { roles } = auth();
  if (!roles || !roles.some((role) => role.id === 'admin')) {
    return redirect(redirectUrl ?? '/');
  }
  return Promise.resolve({ success: true });
}, 'protect-admin');

export const protectPro = query(async (redirectUrl?: string) => {
  'use server';
  const { subscription } = await getProSubscription();
  if (!subscription || subscription.status !== 'active') {
    return redirect(redirectUrl ?? '/pro');
  }
  return { success: true };
}, 'protect-pro');

export const protectNotPro = query(async (redirectUrl?: string) => {
  'use server';
  const { subscription } = await getProSubscription();
  if (subscription?.status === 'active') {
    return redirect(redirectUrl ?? '/');
  }
  return { success: true };
}, 'protect-not-pro');
