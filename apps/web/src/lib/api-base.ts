/**
 * Helper to determine the base URL for API requests.
 * - Server side (SSR): returns an absolute URL using NEXT_PUBLIC_API_URL,
 *   falling back to API_URL or localhost.
 * - Browser side: returns an empty string so Next.js rewrites proxy to the
 *   backend (configured in next.config.js).
 */
export const getApiBase = (): string => {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3000';
  }
  return '';
};
