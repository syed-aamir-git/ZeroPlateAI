export const CATEGORY_EXPIRY_THRESHOLDS_HOURS: Record<string, number> = {
  cooked_food: 2,
  dairy: 12,
  bakery: 12,
  raw_produce: 24,
  packaged: 48,
};

export interface ExpiryStatus {
  isExpired: boolean;
  isNearingExpiry: boolean;
  hoursRemaining: number;
  thresholdHours: number;
}

export function computeExpiryStatus(
  category: string,
  expiryEstimateAt: Date | string
): ExpiryStatus {
  const now = new Date().getTime();
  const expiry = new Date(expiryEstimateAt).getTime();
  const diffMs = expiry - now;
  const hoursRemaining = diffMs / (1000 * 60 * 60);

  const thresholdHours = CATEGORY_EXPIRY_THRESHOLDS_HOURS[category] ?? 12;

  const isExpired = hoursRemaining <= 0;
  const isNearingExpiry = !isExpired && hoursRemaining <= thresholdHours;

  return {
    isExpired,
    isNearingExpiry,
    hoursRemaining: Math.round(hoursRemaining * 10) / 10,
    thresholdHours,
  };
}
