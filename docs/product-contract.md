# WebToApp Product Contract

Status: accepted for v1 implementation

WebToApp converts an eligible web application into secure, configurable, signed
application packages for Android, iOS, Windows, macOS, and Linux. It is a build
and release system, not a mechanism for copying or republishing third-party
websites.

## Product promise

For a website or static web bundle that the customer owns or is authorized to
use, WebToApp will:

1. analyze compatibility and security constraints before a release build;
2. represent platform behavior in one versioned `AppSpec`;
3. generate native application shells with an explicitly limited capability
   surface;
4. build and sign on a customer-controlled runner using customer-owned
   credentials;
5. validate packages and produce checksums, an SBOM, provenance, and
   store-readiness guidance; and
6. preserve enough build metadata to reproduce and audit a release.

The product reports `ready`, `changes_required`, `desktop_only`, `pwa_only`, or
`unsupported`. It does not disguise incompatibility by emitting a package that
is known to be unsafe or non-functional.

## Intended customers

- Owners of web applications and domains.
- Agencies or internal teams with documented authority from the owner.
- Developers who need repeatable multi-platform packaging without maintaining
  five unrelated projects.

Ownership must be verified before a release build through DNS TXT or
`/.well-known/webtoapp-verification.json`. The customer must also attest that it
holds the necessary content, trademark, privacy, and distribution rights. Public
compatibility analysis may run before verification, without credentials.

## Supported inputs

### Public HTTPS URL

- The start URL and every trusted in-app origin must use HTTPS.
- Main-frame navigation is restricted to exact verified origins.
- Authentication that rejects embedded browsers is routed through the operating
  system browser.
- A remote site may update its content without a binary rebuild, but may not
  thereby add native capabilities, permissions, executable code, signing
  identities, or allowed origins.

### Prebuilt static bundle

- A ZIP archive must contain `index.html` and only inert application assets.
- WebToApp never runs scripts or package managers shipped in the archive.
- The default limits are 100 MB compressed, 250 MB extracted, and 10,000 files.
- Absolute paths, path traversal, links, duplicate normalized paths, and
  decompression bombs are rejected.

Git checkout, source compilation, and arbitrary customer build commands are
outside v1.

## Application lifecycle

1. **Analyze** — inspect transport, redirects, mobile behavior, authentication,
   browser APIs, storage, media, files, permissions, offline behavior, and
   policy risks.
2. **Verify** — confirm control of each trusted origin and record the customer's
   rights attestation.
3. **Configure** — create a mutable project draft covering identity, branding,
   navigation, capabilities, targets, compliance, and release policy.
4. **Freeze** — create an immutable `AppSpecV1` revision and SHA-256 digest for
   a build.
5. **Build** — dispatch a signed job envelope to an enrolled customer runner.
6. **Sign and validate** — use credentials held by the customer, verify the
   resulting platform signature, and emit integrity and provenance metadata.
7. **Release** — assemble installable artifacts, source export where applicable,
   store metadata, policy evidence, and a rollback runbook.

Builds that do not configure meaningful native value may be used for development
or direct testing, but are not labeled store-ready.

## Native value and capabilities

The default native capability set is empty. A capability is enabled only when
declared in the frozen spec, scoped to verified origins, explained to the user,
and mediated by the runtime. Supported declarative modules are:

- native top/bottom navigation or desktop sidebar;
- push reception and delivery of the device token to the customer's backend;
- deep links and association-file guidance;
- native share;
- safe file selection and downloads;
- camera, microphone, and location permission mediation;
- system-browser OAuth;
- native splash, offline, timeout, maintenance, and TLS-error screens; and
- safe-area, keyboard, status-bar, and back-button behavior.

WebToApp does not provide arbitrary native plugins, runtime-downloaded native
modules, generic access to the Tauri API, or custom native code in v1.

## Distribution and signing

- Customers supply and control all Apple, Google, Microsoft, and other store
  accounts.
- Signing keys remain on the customer's runner and are never uploaded to the
  WebToApp control plane.
- WebToApp provides guided submission packages, not automatic store submission.
- Store approval cannot be guaranteed. The generated application must comply
  with the store's current rules and provide value beyond a low-value website
  wrapper.
- Mobile store releases update through their store. Direct desktop releases use
  signed update metadata; package-manager releases defer to that manager.

## Data and operational contract

- Tenant-owned records are organization-scoped and protected by database
  row-level security.
- URLs are recorded without credentials, query strings, or fragments.
- Scratch build data is deleted after each job.
- Redacted build logs and unreleased artifacts are retained for 30 days by
  default.
- Released artifacts are retained until customer deletion; audit events are
  retained for one year.
- The initial hosted service targets 99.9% control-plane availability, a
  15-minute recovery point objective, and a four-hour recovery time objective.
  External store and notarization outages are reported separately.

## Explicit non-goals for v1

- Republishing websites without authorization.
- Managed custody of signing keys.
- Automatic app-store submission or an approval guarantee.
- Full offline mirroring of a remote application.
- Biometrics, NFC, geofencing, payments, and arbitrary background execution.
- Electron, RPM, Flatpak, Snap, or ARM Linux outputs.
- Redis, Kubernetes, Temporal, or a microservice topology.

## Release sequence

Android, Windows, and Linux form the first general-availability release. iOS and
macOS follow after customer-controlled Apple builds, TestFlight-compatible
archives, notarization, and store-review pilots pass their gates.
