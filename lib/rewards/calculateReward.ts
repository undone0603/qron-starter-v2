// lib/rewards/calculateReward.ts

export interface RewardInput {
  scanType: 'authentic' | 'suspicious' | 'fake';
  productCategory: 'luxury_fashion' | 'pharma' | 'electronics' | 'automotive' | 'food_bev' | 'other';
  isFirstFlagInRegion: boolean;
  consensusAligned: boolean | null; // null = pending
  userReputationScore: number; // 0-100
  userTenureDays: number;
  scanVelocityToday: number; // scans by this user today
  isHighRiskGeo: boolean;
  historicalConfidenceScore: number; // sku-level, 0-100
}

export interface RewardOutput {
  baseReward: number;
  rarityMultiplier: number;
  accuracyBonus: number;
  geoBonus: number;
  firstFlagBonus: number;
  reputationMultiplier: number;
  velocityPenalty: number;
  finalReward: number; // QRON tokens (18 decimal precision)
  breakdown: string[];
}

// ============================================================================
// Constants
// ============================================================================

const BASE_REWARD = 0.1; // QRON
const MAX_DAILY_REWARD = 25.0; // QRON
const ACCURACY_BONUS = 0.2; // QRON
const GEO_BONUS = 0.3; // QRON
const FIRST_FLAG_BONUS = 0.5; // QRON
const VELOCITY_PENALTY_THRESHOLD = 50; // scans
const VELOCITY_PENALTY_RATE = 0.1; // penalty per scan over threshold

const CATEGORY_MULTIPLIERS: Record<RewardInput['productCategory'], number> = {
  luxury_fashion: 1.5,
  pharma: 1.4,
  electronics: 1.2,
  automotive: 1.3,
  food_bev: 1.1,
  other: 1.0,
};

// ============================================================================
// BigInt fixed-point helpers (18 decimals)
// ============================================================================

const SCALE = 10n ** 18n;

function toFixed18(n: number): bigint {
  // Convert float to fixed-point bigint with 18 decimals
  // Use 6 decimal intermediate to avoid float precision issues
  return BigInt(Math.round(n * 1_000_000)) * (SCALE / 10n ** 6n);
}

function mulFixed18(a: bigint, b: bigint): bigint {
  return (a * b) / SCALE;
}

function fromFixed18(x: bigint): number {
  const str = x.toString().padStart(19, '0');
  const whole = str.slice(0, -18) || '0';
  const frac = str.slice(-18);
  return parseFloat(`${whole}.${frac}`);
}

// ============================================================================
// Main reward calculation
// ============================================================================

/**
 * Calculate QRON reward for a truth claim with complete breakdown.
 * All intermediate calculations use BigInt fixed-point (18 decimals) for precision.
 */
export function calculateReward(input: RewardInput): RewardOutput {
  const breakdown: string[] = [];

  // 1. Base reward
  const baseFixed = toFixed18(BASE_REWARD);
  breakdown.push(`Base reward: ${BASE_REWARD.toFixed(4)} QRON`);

  // 2. Category rarity multiplier
  const rarityMultiplier = CATEGORY_MULTIPLIERS[input.productCategory];
  const rarityFixed = toFixed18(rarityMultiplier);
  breakdown.push(`Category (${input.productCategory}): ${rarityMultiplier}x multiplier`);

  // 3. Accuracy bonus (if consensus aligned = true)
  const accuracyBonus = input.consensusAligned === true ? ACCURACY_BONUS : 0;
  const accuracyFixed = toFixed18(accuracyBonus);
  if (accuracyBonus > 0) {
    breakdown.push(`Accuracy bonus (consensus aligned): +${accuracyBonus.toFixed(4)} QRON`);
  }

  // 4. Geographic risk bonus
  const geoBonus = input.isHighRiskGeo ? GEO_BONUS : 0;
  const geoFixed = toFixed18(geoBonus);
  if (geoBonus > 0) {
    breakdown.push(`High-risk geography bonus: +${geoBonus.toFixed(4)} QRON`);
  }

  // 5. First flag bonus
  const firstFlagBonus = input.scanType === 'fake' && input.isFirstFlagInRegion ? FIRST_FLAG_BONUS : 0;
  const firstFlagFixed = toFixed18(firstFlagBonus);
  if (firstFlagBonus > 0) {
    breakdown.push(`First fake flag in region: +${firstFlagBonus.toFixed(4)} QRON`);
  }

  // 6. Reputation multiplier: (score/100)*0.5 + 0.75 => range [0.75, 1.25]
  const reputationMultiplier = (input.userReputationScore / 100) * 0.5 + 0.75;
  const reputationFixed = toFixed18(reputationMultiplier);
  breakdown.push(`Reputation (${input.userReputationScore.toFixed(1)}): ${reputationMultiplier.toFixed(4)}x multiplier`);

  // 7. Velocity penalty (anti-farming)
  let velocityPenalty = 1.0;
  if (input.scanVelocityToday > VELOCITY_PENALTY_THRESHOLD) {
    const excessScans = input.scanVelocityToday - VELOCITY_PENALTY_THRESHOLD;
    velocityPenalty = Math.max(0.1, 1.0 - excessScans * VELOCITY_PENALTY_RATE);
    breakdown.push(
      `Velocity penalty (${input.scanVelocityToday} scans today, ${excessScans} over limit): ${velocityPenalty.toFixed(4)}x`
    );
  }
  const velocityFixed = toFixed18(velocityPenalty);

  // Calculate pre-multiplier reward: (base * rarity) + bonuses
  const preMultiplierFixed = mulFixed18(baseFixed, rarityFixed) + accuracyFixed + geoFixed + firstFlagFixed;

  // Apply reputation and velocity multipliers
  const afterReputationFixed = mulFixed18(preMultiplierFixed, reputationFixed);
  const finalFixed = mulFixed18(afterReputationFixed, velocityFixed);

  const finalReward = fromFixed18(finalFixed);

  breakdown.push(
    `Final: (${BASE_REWARD} x ${rarityMultiplier} + ${(accuracyBonus + geoBonus + firstFlagBonus).toFixed(4)}) x ${reputationMultiplier.toFixed(4)} x ${velocityPenalty.toFixed(4)} = ${finalReward.toFixed(18)} QRON`
  );

  return {
    baseReward: BASE_REWARD,
    rarityMultiplier,
    accuracyBonus,
    geoBonus,
    firstFlagBonus,
    reputationMultiplier,
    velocityPenalty,
    finalReward: parseFloat(finalReward.toFixed(18)),
    breakdown,
  };
}

// ============================================================================
// Daily limit helpers
// ============================================================================

/**
 * Check whether a new reward would exceed the user's daily limit.
 */
export function checkDailyLimit(
  currentDailyTotal: number,
  newReward: number
): { canClaim: boolean; remaining: number; wouldExceed: boolean } {
  const remaining = Math.max(0, MAX_DAILY_REWARD - currentDailyTotal);
  const wouldExceed = currentDailyTotal + newReward > MAX_DAILY_REWARD;
  return { canClaim: !wouldExceed, remaining, wouldExceed };
}

/**
 * Cap reward to the user's remaining daily allowance.
 */
export function capRewardToDailyLimit(currentDailyTotal: number, calculatedReward: number): number {
  const remaining = Math.max(0, MAX_DAILY_REWARD - currentDailyTotal);
  return Math.min(calculatedReward, remaining);
}

// ============================================================================
// Token conversion utilities
// ============================================================================

/**
 * Convert QRON decimal amount to wei (18-decimal BigInt) for on-chain use.
 */
export function qronToWei(amount: number): bigint {
  return toFixed18(amount);
}

/**
 * Convert wei BigInt back to QRON decimal amount.
 */
export function weiToQron(wei: bigint): number {
  return fromFixed18(wei);
}

// ============================================================================
// Batch and estimation helpers
// ============================================================================

/**
 * Batch calculate rewards for multiple claims.
 */
export function calculateBatchRewards(inputs: RewardInput[]): RewardOutput[] {
  return inputs.map((input) => calculateReward(input));
}

/**
 * Estimate reward range before consensus is reached.
 */
export function estimateRewardRange(input: Omit<RewardInput, 'consensusAligned'>): {
  pending: RewardOutput;
  max: RewardOutput;
  min: RewardOutput;
} {
  return {
    pending: calculateReward({ ...input, consensusAligned: null }),
    max: calculateReward({ ...input, consensusAligned: true }),
    min: calculateReward({ ...input, consensusAligned: false }),
  };
}

/**
 * Format QRON amount for display (trims trailing zeros).
 */
export function formatQRON(amount: number): string {
  return amount.toFixed(18).replace(/\.?0+$/, '');
}

/**
 * Get human-readable category name.
 */
export function getCategoryDisplayName(category: RewardInput['productCategory']): string {
  const names: Record<RewardInput['productCategory'], string> = {
    luxury_fashion: 'Luxury Fashion',
    pharma: 'Pharmaceutical',
    electronics: 'Electronics',
    automotive: 'Automotive',
    food_bev: 'Food & Beverage',
    other: 'Other',
  };
  return names[category];
}

// Export constants for UI/docs
export const REWARD_CONSTANTS = {
  BASE_REWARD,
  MAX_DAILY_REWARD,
  ACCURACY_BONUS,
  GEO_BONUS,
  FIRST_FLAG_BONUS,
  VELOCITY_PENALTY_THRESHOLD,
  VELOCITY_PENALTY_RATE,
  CATEGORY_MULTIPLIERS,
} as const;
