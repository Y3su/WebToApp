# ADR 0003: Keep Signing on Customer-Controlled Runners

- Status: Accepted
- Date: 2026-09-05

## Context

Application signing keys authorize releases to operating systems and stores.
Central custody would make the hosted service a high-value key vault, expand
compliance obligations, and allow a control-plane compromise to sign customer
software. Apple and platform tooling also impose operating-system-specific build
requirements.

## Decision

- Perform release signing only on a runner controlled by the customer.
- Keep Android keystores, Apple identities, Windows certificates, Linux
  repository keys, and store credentials on that machine or in a
  customer-selected signing provider.
- Store only public fingerprints, human-readable labels, and opaque secret
  references in the control plane.
- Enroll a runner with a one-time token, then use an Ed25519 device identity and
  rotating mTLS certificate held in the OS keychain.
- Bind each runner to one organization and accept outbound runner connections
  only.
- Sign every job envelope and include organization, target, immutable
  spec/source/toolchain/template digests, nonce, and expiry.
- Return signed provenance and platform signature-verification results with the
  artifact.
- Treat an interrupted signing operation as requiring reconciliation; never
  retry it blindly.

## Consequences

Positive:

- A control-plane breach does not directly expose customer private signing keys.
- Customers retain store ownership, signing lineage, revocation, and rotation
  control.
- Builds can reach private applications without sending credentials or
  source-network access to the hosted service.
- Platform signing tools run on their supported operating systems.

Costs:

- Customers must provision, secure, monitor, and keep runners online.
- Runner enrollment, upgrades, diagnostics, and recovery become core product
  workflows.
- Fully unattended hosted signing is not available in v1.
- Support must distinguish control-plane failures from local credential and
  toolchain failures.

## Alternatives considered

- **Hosted key custody:** rejected for v1 because of breach impact, compliance
  burden, and conflict with customer ownership.
- **Unsigned output only:** rejected because production-ready packages and
  validation require signing.
- **Ask customers to sign manually after download:** rejected as the sole path
  because it loses end-to-end provenance and produces an error-prone release
  workflow.
