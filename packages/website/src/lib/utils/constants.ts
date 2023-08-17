/** Commonly referenced routes throughout the app */
export const commonRoutes = {
	login: '/auth/login',
	resetPassword: '/auth/reset-password',
	refreshSession: '/auth/session/refresh'
} as const;

/** Page routes related to authentication. */
export const authPages: string[] = [
	commonRoutes.login,
	commonRoutes.resetPassword,
	commonRoutes.refreshSession
];
