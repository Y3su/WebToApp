import type { TaskList } from "graphile-worker";
import postgres from "postgres";

export function createTaskList(databaseUrl: string): TaskList {
  const sql = postgres(databaseUrl, {
    max: 3,
    connect_timeout: 10,
    idle_timeout: 20,
    prepare: false,
  });

  return {
    expire_build_leases: async (_payload, helpers) => {
      const expired = await sql`
        UPDATE build_targets
        SET status = 'expired', updated_at = NOW(), error_code = 'lease_expired'
        WHERE status IN (
          'leased', 'preparing', 'building', 'validating',
          'awaiting_signing', 'signing', 'verifying'
        )
          AND lease_expires_at IS NOT NULL
          AND lease_expires_at <= NOW()
        RETURNING id
      `;

      helpers.logger.info(
        `Expired ${expired.length} stale build target leases.`,
      );
    },
    expire_domain_verifications: async (_payload, helpers) => {
      const expired = await sql`
        UPDATE domain_verifications
        SET status = 'expired', updated_at = NOW()
        WHERE status IN ('pending', 'verified')
          AND expires_at <= NOW()
        RETURNING id
      `;

      helpers.logger.info(`Expired ${expired.length} domain verifications.`);
    },
  };
}
