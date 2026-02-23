// app/qronModes.ts
export type QronMode =
  | 'static'
  | 'stereographic'
  | 'kinetic'
  | 'holographic'
  | 'memory'
  | 'echo'
  | 'temporal'
  | 'reactive'
  | 'layered'
  | 'dimensional'
  | 'living';

export const QRON_MODE_CONFIG: Record<
  QronMode,
  {
    label: string;
    description: string;
    verificationState: 'verified' | 'warning' | 'flagged';
    rarityTier: 'common' | 'rare' | 'legendary';
  }
> = {
  static: {
    label: 'Static',
    description: 'AI-styled QR • High resolution • Instant generation',
    verificationState: 'verified',
    rarityTier: 'common',
  },
  stereographic: {
    label: 'Stereographic',
    description: 'Circular, lens-like QR projection.',
    verificationState: 'verified',
    rarityTier: 'rare',
  },
  kinetic: {
    label: 'Kinetic',
    description: 'Subtle motion and energy.',
    verificationState: 'warning',
    rarityTier: 'rare',
  },
  holographic: {
    label: 'Holographic',
    description: 'Gradient, prismatic surface.',
    verificationState: 'verified',
    rarityTier: 'legendary',
  },
  memory: {
    label: 'Memory',
    description: 'Watermarked with journey hints.',
    verificationState: 'verified',
    rarityTier: 'rare',
  },
  echo: {
    label: 'Echo',
    description: 'Layered, fading repetitions.',
    verificationState: 'warning',
    rarityTier: 'rare',
  },
  temporal: {
    label: 'Temporal',
    description: 'Time-ringed, pulsing perimeter.',
    verificationState: 'verified',
    rarityTier: 'legendary',
  },
  reactive: {
    label: 'Reactive',
    description: 'Color-shifts with state.',
    verificationState: 'flagged',
    rarityTier: 'rare',
  },
  layered: {
    label: 'Layered',
    description: 'Stacked depth and planes.',
    verificationState: 'verified',
    rarityTier: 'rare',
  },
  dimensional: {
    label: 'Dimensional',
    description: 'Perspective-warped grid.',
    verificationState: 'warning',
    rarityTier: 'legendary',
  },
  living: {
    label: 'Living',
    description: 'Particle halo and evolving aura.',
    verificationState: 'verified',
    rarityTier: 'legendary',
  },
};
