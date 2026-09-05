# Security policy

## Supported versions

Until the first stable release, only the latest commit on `main` receives
security fixes. Stable-version support windows will be published before 1.0.

## Reporting a vulnerability

Use GitHub private vulnerability reporting for this repository. Do not include
secrets, customer data, signing material, or active exploitation details in a
public issue.

Include the affected revision, impact, prerequisites, reproduction steps, and
suggested mitigation. Maintainers will acknowledge complete reports within three
business days and coordinate disclosure after a fix is available.

## Security boundaries

- Customer signing credentials must remain on customer-controlled runners.
- Release builds accept only verified HTTPS origins or validated static bundles.
- Native capabilities are disabled unless explicitly declared and origin scoped.
- Build inputs and uploaded archives are untrusted.

See `docs/threat-model.md` for the complete model.
