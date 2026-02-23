'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCodeStyling, { Options } from 'qr-code-styling';

interface JourneyStats {
  scans: number;
  cities: number;
  daysAlive: number;
}

interface UserTraits {
  firstScan: boolean;
  achievementLevel: number; // 0-10
}

export interface QRONCodeProps {
  codeId: string;
  payload: string;
  verificationState: 'verified' | 'warning' | 'flagged';
  rarityTier: 'common' | 'rare' | 'legendary';
  journeyStats: JourneyStats;
  userTraits: UserTraits;
  size?: number;
  className?: string;
}

interface ParticleData {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  size: number;
}

const STATE_COLORS = {
  verified: { primary: '#10b981', secondary: '#34d399', glow: '#6ee7b7' },
  warning:  { primary: '#f59e0b', secondary: '#fbbf24', glow: '#fcd34d' },
  flagged:  { primary: '#ef4444', secondary: '#f87171', glow: '#fca5a5' },
};

const RARITY_CONFIG = {
  common:    { count: 12, speed: 8, opacity: 0.3 },
  rare:      { count: 24, speed: 6, opacity: 0.5 },
  legendary: { count: 48, speed: 4, opacity: 0.7 },
};

function generateParticles(count: number, radius: number, seed: string, size: number): ParticleData[] {
  const out: ParticleData[] = [];
  const hash = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let i = 0; i < count; i++) {
    const a1 = ((hash + i * 137.5) % 360) * (Math.PI / 180);
    const a2 = ((hash + 180 + i * 89.3) % 360) * (Math.PI / 180);
    const r1 = radius * 0.5 + ((hash + i * 97) % (radius * 0.4));
    const r2 = radius * 0.5 + ((hash + i * 73) % (radius * 0.4));
    out.push({
      x1: size / 2 + r1 * Math.cos(a1),
      y1: size / 2 + r1 * Math.sin(a1),
      x2: size / 2 + r2 * Math.cos(a2),
      y2: size / 2 + r2 * Math.sin(a2),
      size: 1.2 + ((hash + i) % 3),
    });
  }
  return out;
}

function buildEffectsSVG(args: {
  codeId: string;
  size: number;
  colors: { primary: string; secondary: string; glow: string };
  rarity: 'common' | 'rare' | 'legendary';
  rarityConfig: { count: number; speed: number; opacity: number };
  journeyStats: JourneyStats;
  userTraits: UserTraits;
}): string {
  const { codeId, size, colors, rarity, rarityConfig, journeyStats, userTraits } = args;
  const padding = 24;
  const viewBoxSize = size + padding * 2;
  const center = viewBoxSize / 2;
  const qrRadius = size / 2;
  const particles = generateParticles(rarityConfig.count, qrRadius, codeId, size);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${viewBoxSize}" height="${viewBoxSize}" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}">
  <defs>
    <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${colors.glow}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${colors.primary}" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>
  <circle cx="${center}" cy="${center}" r="${qrRadius + 20}" fill="url(#glowGrad)"/>
  <circle cx="${center}" cy="${center}" r="${qrRadius + 4}" fill="none" stroke="${colors.primary}" stroke-width="1.5" opacity="0.6">
    <animate attributeName="r" values="${qrRadius + 4};${qrRadius + 12};${qrRadius + 4}" dur="3s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" repeatCount="indefinite"/>
  </circle>
  <circle cx="${center}" cy="${center}" r="${qrRadius + 16}" fill="none" stroke="${colors.secondary}" stroke-width="0.8" opacity="0.3">
    <animate attributeName="r" values="${qrRadius + 16};${qrRadius + 24};${qrRadius + 16}" dur="4s" repeatCount="indefinite"/>
  </circle>
  ${rarity !== 'common' ? `<circle cx="${center}" cy="${center}" r="${qrRadius + 28}" fill="none" stroke="${colors.glow}" stroke-width="2" stroke-dasharray="8 4" opacity="0.5"><animateTransform attributeName="transform" type="rotate" values="0 ${center} ${center};360 ${center} ${center}" dur="${rarity === 'legendary' ? '8' : '12'}s" repeatCount="indefinite"/></circle>` : ''}
  ${particles.map((p, i) => `<circle r="${p.size}" fill="${colors.primary}" filter="url(#blur)">
    <animateTransform attributeName="transform" type="translate" values="${p.x1},${p.y1};${p.x2},${p.y2};${p.x1},${p.y1}" dur="${rarityConfig.speed}s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="${rarityConfig.opacity};${rarityConfig.opacity * 0.3};${rarityConfig.opacity}" dur="${rarityConfig.speed}s" repeatCount="indefinite"/>
  </circle>`).join('')}
  ${userTraits.firstScan ? `<text x="${center}" y="${viewBoxSize - 8}" text-anchor="middle" font-size="10" fill="${colors.primary}" opacity="0.8">FIRST SCAN • ${journeyStats.scans} scans • ${journeyStats.cities} cities • ${journeyStats.daysAlive}d</text>` : ''}
</svg>`;
}

const QRONCode: React.FC<QRONCodeProps> = ({
  codeId, payload, verificationState, rarityTier, journeyStats, userTraits, size = 256, className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [qrInstance, setQrInstance] = useState<QRCodeStyling | null>(null);
  const [svgMarkup, setSvgMarkup] = useState<string>('');

  const colors = STATE_COLORS[verificationState];
  const rarityConfig = RARITY_CONFIG[rarityTier];

  useEffect(() => {
    const options: Options = {
      width: size,
      height: size,
      type: 'svg',
      data: payload,
      dotsOptions: { color: '#000000', type: 'square' },
      backgroundOptions: { color: 'transparent' },
      qrOptions: { errorCorrectionLevel: 'H' },
      cornersSquareOptions: { color: '#000000', type: 'square' },
      cornersDotOptions: { color: '#000000', type: 'square' },
    };
    const qr = new QRCodeStyling(options);
    setQrInstance(qr);
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      qr.append(containerRef.current);
    }
  }, [payload, size]);

useEffect(() => {
  if (!qrInstance) return;

  qrInstance.getRawData("svg")
    .then((svg) => {
      setSvgMarkup(svg); // svg is always a string
    })
    .catch(console.error);
}, [qrInstance]);



  const effectsSvg = buildEffectsSVG({ codeId, size, colors, rarity: rarityTier, rarityConfig, journeyStats, userTraits });

  return (
    <div className={`qron-code-wrapper ${className}`} style={{ position: 'relative', width: size, height: size }}>
      {/* Effects layer — behind QR */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}
        dangerouslySetInnerHTML={{ __html: effectsSvg }} />
      {/* QR code — foreground */}
      <div ref={containerRef} className="relative" style={{ zIndex: 10, width: size, height: size }} />
    </div>
  );
};

export default QRONCode;

// Export utilities
export const exportQRONAsPNG = async (qrInstance: QRCodeStyling | null): Promise<Blob | null> => {
  if (!qrInstance) return null;
  try { return (await qrInstance.getRawData('png')) || null; } catch { return null; }
};

export const exportQRONAsSVG = (svgString: string): Blob =>
  new Blob([svgString], { type: 'image/svg+xml' });
