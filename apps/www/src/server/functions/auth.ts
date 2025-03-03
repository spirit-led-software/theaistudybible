import { query, redirect } from '@solidjs/router';
import { auth } from '../utils/auth';
import { getSubscription } from './pro';

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

/**
 * Protects the route from being accessed by users without a subscription.
 * @param redirectUrl - The URL to redirect to if the user has no subscription. Defaults to '/pro'.
 */
export const protectNotFree = query(async (redirectUrl?: string) => {
  'use server';
  const { subscription } = await getSubscription();
  if (subscription?.status !== 'active' && subscription?.status !== 'trialing') {
    return redirect(redirectUrl ?? '/pro');
  }
  return { success: true };
}, 'protect-not-free');

/**
 * Protects the route from being accessed by users with a subscription.
 * @param redirectUrl - The URL to redirect to if the user has a subscription. Defaults to '/profile'.
 */
export const protectFree = query(async (redirectUrl?: string) => {
  'use server';
  const { subscription } = await getSubscription();
  if (subscription?.status === 'active' || subscription?.status === 'trialing') {
    return redirect(redirectUrl ?? '/profile');
  }
  return { success: true };
}, 'protect-free');
