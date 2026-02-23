// lib/rewards/rewardHelpers.ts
import { calculateReward, checkDailyLimit, RewardInput } from './calculateReward';

/**
 * High-level reward calculation with daily limit checking.
 * Use this in API endpoints.
 */
export async function calculateAndValidateReward(
  input: RewardInput,
  currentDailyTotal: number
): Promise<{
  reward: ReturnType<typeof calculateReward>;
  canClaim: boolean;
  limitInfo: ReturnType<typeof checkDailyLimit>;
}> {
  const reward = calculateReward(input);
  const limitInfo = checkDailyLimit(currentDailyTotal, reward.finalReward);

  return {
    reward,
    canClaim: limitInfo.canClaim,
    limitInfo,
  };
}

/**
 * Format QRON amount for display (18 decimals, trimmed trailing zeros).
 */
export function formatQRON(amount: number): string {
  return amount.toFixed(18).replace(/\.?0+$/, '');
}

/**
 * Get human-readable category name.
 */
export function getCategoryDisplayName(
  category: RewardInput['productCategory']
): string {
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

/**
 * Get human-readable scan type label.
 */
export function getScanTypeLabel(
  scanType: RewardInput['scanType']
): string {
  const labels: Record<RewardInput['scanType'], string> = {
    authentic: 'Authentic',
    suspicious: 'Suspicious',
    fake: 'Counterfeit',
  };
  return labels[scanType];
}

/**
 * Estimate reward for display in UI before submission.
 * Uses pending consensus (null) for optimistic estimate.
 */
export function estimateRewardForDisplay(
  input: Omit<RewardInput, 'consensusAligned'>
): {
  optimistic: string;
  conservative: string;
  pending: string;
} {
  const withConsensus = calculateReward({ ...input, consensusAligned: true });
  const withoutConsensus = calculateReward({ ...input, consensusAligned: false });
  const pending = calculateReward({ ...input, consensusAligned: null });

  return {
    optimistic: formatQRON(withConsensus.finalReward),
    conservative: formatQRON(withoutConsensus.finalReward),
    pending: formatQRON(pending.finalReward),
  };
}
