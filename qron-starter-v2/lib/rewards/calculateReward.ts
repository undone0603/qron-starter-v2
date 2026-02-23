// lib/rewards/calculateReward.ts
// QRON AuthiChain reward calculation engine with BigInt fixed-point math

export interface RewardInput {
  scanType: 'authentic' | 'suspicious' | 'fake';
  productCategory: 'luxury_fashion' | 'pharma' | 'electronics' | 'automotive' | 'food_bev' | 'other';
  isFirstFlagInRegion: boolean;
  consensusAligned: boolean | null; // null = pending
  userReputationScore: number;      // 0-100
  userTenureDays: number;
  scanVelocityToday: number;        // scans by this user today
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
// CONSTANTS
// ============================================================================
export const REWARD_CONSTANTS = {
  BASE_REWARD: 0.1,
  MAX_DAILY_REWARD: 25.0,
  ACCURACY_BONUS: 0.2,
  GEO_BONUS: 0.3,
  FIRST_FLAG_BONUS: 0.5,
  VELOCITY_PENALTY_THRESHOLD: 50,
  VELOCITY_PENALTY_RATE: 0.1,
  CATEGORY_MULTIPLIERS: {
    luxury_fashion: 1.5,
    pharma: 1.4,
    electronics: 1.2,
    automotive: 1.3,
    food_bev: 1.1,
    other: 1.0,
  },
} as const;

// ============================================================================
// FIXED-POINT BIGINT HELPERS (18 decimals)
// ============================================================================
const SCALE = 10n ** 18n;

function toFixed18(n: number): bigint {
  const rounded = Math.round(n * 1_000_000);
  return BigInt(rounded) * (SCALE / 1_000_000n);
}

function mul18(a: bigint, b: bigint): bigint {
  return (a * b) / SCALE;
}

function fromFixed18(x: bigint): number {
  const str = x.toString().padStart(19, '0');
  const whole = str.slice(0, -18) || '0';
  const frac  = str.slice(-18);
  return parseFloat(`${whole}.${frac}`);
}

// ============================================================================
// MAIN REWARD CALCULATION
// ============================================================================
export function calculateReward(input: RewardInput): RewardOutput {
  const breakdown: string[] = [];
  const { REWARD_CONSTANTS: C } = { REWARD_CONSTANTS };

  // 1. Base reward
  let rewardBig = toFixed18(REWARD_CONSTANTS.BASE_REWARD);
  breakdown.push(`Base: ${REWARD_CONSTANTS.BASE_REWARD} QRON`);

  // 2. Category multiplier
  const rarityMultiplier = REWARD_CONSTANTS.CATEGORY_MULTIPLIERS[input.productCategory];
  rewardBig = mul18(rewardBig, toFixed18(rarityMultiplier));
  breakdown.push(`Category (${input.productCategory}): ${rarityMultiplier}x`);

  // 3. Accuracy bonus (consensus aligned)
  let bonusBig = 0n;
  const accuracyBonus = input.consensusAligned === true ? REWARD_CONSTANTS.ACCURACY_BONUS : 0;
  if (accuracyBonus > 0) {
    bonusBig += toFixed18(accuracyBonus);
    breakdown.push(`Accuracy bonus (consensus aligned): +${accuracyBonus} QRON`);
  }

  // 4. Geo bonus
  const geoBonus = input.isHighRiskGeo ? REWARD_CONSTANTS.GEO_BONUS : 0;
  if (geoBonus > 0) {
    bonusBig += toFixed18(geoBonus);
    breakdown.push(`High-risk geo bonus: +${geoBonus} QRON`);
  }

  // 5. First-flag bonus
  const firstFlagBonus = (input.scanType === 'fake' && input.isFirstFlagInRegion) ? REWARD_CONSTANTS.FIRST_FLAG_BONUS : 0;
  if (firstFlagBonus > 0) {
    bonusBig += toFixed18(firstFlagBonus);
    breakdown.push(`First fake flag in region: +${firstFlagBonus} QRON`);
  }

  rewardBig += bonusBig;

  // 6. Reputation multiplier (0.75x – 1.25x)
  const reputationMultiplier = (input.userReputationScore / 100) * 0.5 + 0.75;
  rewardBig = mul18(rewardBig, toFixed18(reputationMultiplier));
  breakdown.push(`Reputation (${input.userReputationScore.toFixed(1)}): ${reputationMultiplier.toFixed(4)}x`);

  // 7. Velocity penalty (anti-farming)
  let velocityPenalty = 1.0;
  if (input.scanVelocityToday > REWARD_CONSTANTS.VELOCITY_PENALTY_THRESHOLD) {
    const excess = input.scanVelocityToday - REWARD_CONSTANTS.VELOCITY_PENALTY_THRESHOLD;
    velocityPenalty = Math.max(0.1, 1.0 - excess * REWARD_CONSTANTS.VELOCITY_PENALTY_RATE);
    rewardBig = mul18(rewardBig, toFixed18(velocityPenalty));
    breakdown.push(`Velocity penalty (${input.scanVelocityToday} scans, ${excess} over limit): ${velocityPenalty.toFixed(4)}x`);
  }

  const finalReward = fromFixed18(rewardBig);
  breakdown.push(`Final: ${finalReward.toFixed(18)} QRON`);

  return {
    baseReward: REWARD_CONSTANTS.BASE_REWARD,
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
// WEI CONVERTERS
// ============================================================================
export function qronToWei(amount: number): bigint {
  const [whole, fraction = ''] = amount.toString().split('.');
  const paddedFraction = fraction.padEnd(18, '0').slice(0, 18);
  return BigInt(whole + paddedFraction);
}

export function weiToQron(wei: bigint): number {
  const str = wei.toString().padStart(19, '0');
  return parseFloat(`${str.slice(0, -18) || '0'}.${str.slice(-18)}`);
}

// ============================================================================
// DAILY LIMIT HELPERS
// ============================================================================
export function checkDailyLimit(
  currentDailyTotal: number,
  newReward: number
): { canClaim: boolean; remaining: number; wouldExceed: boolean } {
  const remaining = Math.max(0, REWARD_CONSTANTS.MAX_DAILY_REWARD - currentDailyTotal);
  const wouldExceed = currentDailyTotal + newReward > REWARD_CONSTANTS.MAX_DAILY_REWARD;
  return { canClaim: !wouldExceed, remaining, wouldExceed };
}

export function capRewardToDailyLimit(currentDailyTotal: number, calculatedReward: number): number {
  return Math.min(calculatedReward, Math.max(0, REWARD_CONSTANTS.MAX_DAILY_REWARD - currentDailyTotal));
}

export function estimateRewardRange(
  input: Omit<RewardInput, 'consensusAligned'>
): { min: RewardOutput; max: RewardOutput; pending: RewardOutput } {
  return {
    pending: calculateReward({ ...input, consensusAligned: null }),
    max:     calculateReward({ ...input, consensusAligned: true }),
    min:     calculateReward({ ...input, consensusAligned: false }),
  };
}

// Export types
export type { RewardInput, RewardOutput };

// Export constants for use in UI/docs
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

/**
 * Batch calculate rewards for multiple claims (e.g., consensus resolution).
 */
export function calculateBatchRewards(inputs: RewardInput[]): RewardOutput[] {
  return inputs.map((input) => calculateReward(input));
}
