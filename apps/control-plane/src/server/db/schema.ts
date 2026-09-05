import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const organizationRole = pgEnum("organization_role", [
  "owner",
  "admin",
  "developer",
  "release_manager",
  "viewer",
]);

export const verificationStatus = pgEnum("verification_status", [
  "pending",
  "verified",
  "expired",
  "revoked",
]);

export const buildStatus = pgEnum("build_status", [
  "queued",
  "leased",
  "preparing",
  "building",
  "validating",
  "awaiting_signing",
  "signing",
  "verifying",
  "completed",
  "failed",
  "cancelled",
  "expired",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  displayName: text("display_name").notNull(),
  image: text("image"),
  ...timestamps,
});

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ...timestamps,
});

export const memberships = pgTable(
  "memberships",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: organizationRole("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.userId] }),
    index("memberships_user_idx").on(table.userId),
  ],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("projects_org_slug_idx").on(table.organizationId, table.slug),
    index("projects_org_idx").on(table.organizationId),
  ],
);

export const domainVerifications = pgTable(
  "domain_verifications",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    hostname: text("hostname").notNull(),
    method: text("method").notNull(),
    challengeHash: text("challenge_hash").notNull(),
    status: verificationStatus("status").notNull().default("pending"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("domain_verifications_project_host_idx").on(
      table.projectId,
      table.hostname,
    ),
    index("domain_verifications_org_idx").on(table.organizationId),
  ],
);

export const appSpecRevisions = pgTable(
  "app_spec_revisions",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    revision: integer("revision").notNull(),
    digest: text("digest").notNull(),
    document: jsonb("document").notNull(),
    frozenAt: timestamp("frozen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    uniqueIndex("app_spec_project_revision_idx").on(
      table.projectId,
      table.revision,
    ),
    uniqueIndex("app_spec_project_digest_idx").on(
      table.projectId,
      table.digest,
    ),
    index("app_spec_org_idx").on(table.organizationId),
  ],
);

export const runners = pgTable(
  "runners",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    publicKey: text("public_key").notNull(),
    certificateFingerprint: text("certificate_fingerprint").notNull(),
    capabilities: jsonb("capabilities").notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("runners_fingerprint_idx").on(table.certificateFingerprint),
    index("runners_org_idx").on(table.organizationId),
  ],
);

export const builds = pgTable(
  "builds",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    appSpecRevisionId: uuid("app_spec_revision_id")
      .notNull()
      .references(() => appSpecRevisions.id, { onDelete: "restrict" }),
    idempotencyKey: text("idempotency_key").notNull(),
    policyPackVersion: text("policy_pack_version").notNull(),
    status: buildStatus("status").notNull().default("queued"),
    requestedBy: uuid("requested_by").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("builds_org_idempotency_idx").on(
      table.organizationId,
      table.idempotencyKey,
    ),
    index("builds_project_idx").on(table.projectId),
    index("builds_org_idx").on(table.organizationId),
  ],
);

export const buildTargets = pgTable(
  "build_targets",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    buildId: uuid("build_id")
      .notNull()
      .references(() => builds.id, { onDelete: "cascade" }),
    target: text("target").notNull(),
    architecture: text("architecture").notNull(),
    status: buildStatus("status").notNull().default("queued"),
    runnerId: uuid("runner_id").references(() => runners.id, {
      onDelete: "set null",
    }),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    attempt: integer("attempt").notNull().default(0),
    errorCode: text("error_code"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("build_targets_build_target_arch_idx").on(
      table.buildId,
      table.target,
      table.architecture,
    ),
    index("build_targets_org_status_idx").on(
      table.organizationId,
      table.status,
    ),
  ],
);

export const artifacts = pgTable(
  "artifacts",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    buildTargetId: uuid("build_target_id")
      .notNull()
      .references(() => buildTargets.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    objectKey: text("object_key").notNull().unique(),
    sha256: text("sha256").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    signatureVerified: boolean("signature_verified").notNull().default(false),
    metadata: jsonb("metadata").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("artifacts_org_idx").on(table.organizationId)],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: uuid("resource_id"),
    requestId: text("request_id").notNull(),
    metadata: jsonb("metadata").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_events_org_time_idx").on(
      table.organizationId,
      table.createdAt,
    ),
  ],
);
