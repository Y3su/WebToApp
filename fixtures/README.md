# Analyzer and runtime fixtures

These fixtures are intentionally small, deterministic inputs for compatibility
analysis and runtime security tests. Reserved `.test` domains prevent accidental
requests to real services.

- `web/safe`: a self-contained, responsive, installable public-site shape.
- `web/incompatible/mixed-content`: an HTTPS page shape with an HTTP
  subresource.
- `web/incompatible/popup-external`: user-triggered popup and external
  navigation.
- `web/malicious/iframe-bridge-attempt`: a child frame that emits a
  bridge-shaped message for main-frame enforcement tests; it invokes no native
  API.
- `archives/traversal`: metadata representing unsafe archive entry names. It is
  not a real archive and extracting it cannot write any files.

Each case has a `fixture.json` file describing expected analyzer observations.
Fixture metadata is descriptive rather than coupled to an analyzer's internal
result schema.
