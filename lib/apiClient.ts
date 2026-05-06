/** Use on same-origin API routes that rely on the session cookie */
export const withCredentials = { credentials: 'include' } satisfies RequestInit
