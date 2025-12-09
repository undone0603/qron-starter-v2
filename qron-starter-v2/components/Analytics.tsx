'use client';

import { inject } from '@vercel/analytics';

/**
 * Analytics component that initializes Vercel Web Analytics
 * Must run on the client side
 */
export function Analytics() {
  inject();
  return null;
}
