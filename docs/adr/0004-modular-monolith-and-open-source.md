# ADR 0004: Build an Open-Source Modular Monolith

- Status: Accepted
- Date: 2026-09-05

## Context

The initial team must ship a dashboard, API, jobs, analyzer, artifact lifecycle,
runner, and five platform builders without creating unnecessary
distributed-systems overhead. Customers also need to inspect the code that
analyzes their sites, generates applications, and instructs local signing. The
commercial model is managed operations, not source-code exclusivity.

## Decision

- Publish the complete platform under Apache-2.0, including the dashboard, API,
  orchestration, policy engine, analyzer, CLI/runner, SDK, and runtimes.
- Use a TypeScript modular monolith for the control plane with separately
  runnable web/API and Graphile Worker processes.
- Use PostgreSQL as the transactional source of truth and durable job queue,
  with S3-compatible object storage for artifacts.
- Keep module boundaries explicit in the monorepo and communicate through stable
  in-process interfaces or durable database/job contracts.
- Use a Rust process for the customer runner and platform-native runtime
  toolchains where required.
- Fund development through managed hosting, build capacity, support, and
  enterprise operations.
- Do not add Redis, Kubernetes, Temporal, or independent microservices in v1.

## Consequences

Positive:

- A clean checkout exposes the complete trust and build path for audit and
  self-hosting.
- Transactions, migrations, testing, and local development remain
  straightforward.
- One repository can enforce AppSpec and policy compatibility across every
  component.
- Commercial value comes from reliable operations and support rather than an
  artificial code split.

Costs:

- Public interfaces and security fixes require disciplined disclosure and
  compatibility practices.
- Process-level scaling is coarser than independently deployed services.
- Module boundaries must be enforced through review and tests rather than
  network boundaries.
- Managed-service differentiation must come from execution quality.

## Evolution rule

A module may become a service only after measured scaling, isolation, ownership,
or availability requirements cannot be met by separate process deployment of the
monolith. Any extraction requires a new ADR covering data ownership, failure
semantics, authentication, observability, and local-development impact.

## Alternatives considered

- **Microservices from inception:** rejected because they add deployment,
  consistency, tracing, and local-development cost before independent scaling is
  proven.
- **Closed control plane with open runtimes:** rejected because the accepted
  product model makes the complete build and trust path public.
- **Single executable for all functions:** rejected because web serving,
  background work, analysis, and local signing have different privilege and
  scaling boundaries even though they share one repository.
