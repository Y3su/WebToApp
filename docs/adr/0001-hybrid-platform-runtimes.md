# ADR 0001: Use Dedicated Mobile Runtimes and Tauri for Desktop

- Status: Accepted
- Date: 2026-09-05

## Context

WebToApp must turn one web application into production-grade packages for five
operating systems while enforcing exact-origin navigation, secure OAuth,
permission mediation, deep links, files, native UI, and store rules. A single
generic wrapper would reduce initial code but would also expose the product to
the lowest-common-denominator security and lifecycle model.

Production mobile applications need direct control over Android WebView and
WKWebView. Desktop targets share enough windowing, installer, and updater
behavior to benefit from a common shell. Capacitor's remote `server.url` path is
intended for live reload rather than this production URL-mode architecture.
Electron duplicates a browser runtime and creates a larger update and security
surface.

## Decision

- Build Android with Kotlin, AndroidX, and the system WebView.
- Build iOS with SwiftUI and WKWebView.
- Build Windows, macOS, and Linux with Tauri 2 and the operating system's
  WebView.
- Keep the capability contract and bridge message schema common, but implement
  platform mediation natively.
- Keep remote desktop content isolated from generic Tauri commands; a trusted
  local shell brokers allowed actions.
- Do not use Capacitor or Electron for v1 application runtimes.

## Consequences

Positive:

- Security and navigation policy are explicit on every platform.
- Mobile store integrations use first-party platform APIs.
- Desktop installers and updater logic share a Rust/Tauri implementation.
- Generated applications remain smaller than an Electron equivalent.

Costs:

- Mobile behavior must be implemented and tested twice.
- Common contract tests and fixtures are required to prevent platform drift.
- Apple outputs require a macOS runner; Windows packaging requires a Windows
  runner.
- OS WebView differences remain observable and must be represented in
  compatibility analysis.

## Alternatives considered

- **One Capacitor application for mobile:** rejected because production remote
  URL loading is not its intended deployment model and because WebView policy
  needs tighter platform control.
- **Electron for desktop:** rejected because bundling Chromium increases package
  size, patch responsibility, and attack surface.
- **One Tauri runtime for all five platforms:** rejected for v1 because
  dedicated mobile shells provide clearer store, navigation, and capability
  control.
- **Fully native rendering:** rejected because the product's purpose is to
  preserve customer web applications rather than rewrite their interfaces.
