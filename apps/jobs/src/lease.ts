export type LeaseStatus =
  | "queued"
  | "leased"
  | "preparing"
  | "building"
  | "validating"
  | "awaiting_signing"
  | "signing"
  | "verifying"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired";

const leaseHoldingStatuses = new Set<LeaseStatus>([
  "leased",
  "preparing",
  "building",
  "validating",
  "awaiting_signing",
  "signing",
  "verifying",
]);

export function shouldExpireLease(
  status: LeaseStatus,
  leaseExpiresAt: Date | null,
  now: Date,
): boolean {
  return (
    leaseHoldingStatuses.has(status) &&
    leaseExpiresAt !== null &&
    leaseExpiresAt.getTime() <= now.getTime()
  );
}
