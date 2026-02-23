import { Analytics as VercelAnalytics } from '@vercel/analytics/next';

/**
 * Analytics component that initializes Vercel Web Analytics
 * Re-export of Vercel Analytics for cleaner imports
 */
export function Analytics() {
  return <VercelAnalytics />;
}
