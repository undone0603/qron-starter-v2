'use client';

import { useEffect } from 'react';

export default function ScanLogger({ qronId }: { qronId: string }) {
  useEffect(() => {
    // Log this scan once on mount — fire and forget
    fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qronId }),
    }).catch(() => {
      // Silent fail — scan logging is non-critical
    });
  }, [qronId]);

  return null;
}
