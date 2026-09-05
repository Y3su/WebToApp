# WebToApp v1 Support Matrix

Status: target support; an output becomes supported only when its milestone gate
passes

WebToApp distinguishes **development**, **beta**, and **general availability
(GA)** support. A package emitted by an unfinished builder is not automatically
supported or store-ready.

## Release phases

| Phase    | Platforms               | Gate                                                                                                                        |
| -------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| First GA | Android, Windows, Linux | 30-day beta, at least 95% supported-fixture build success, and no unresolved critical/high findings                         |
| Apple GA | iOS, macOS              | Customer-controlled Apple builds, TestFlight-compatible archive, notarized DMG, store-review pilots, and 30-day stable beta |

## Platform outputs

| Platform | Runtime                 | v1 outputs                                                         | Architectures                        | Required build host                                                  | Initial OS baseline                                                                                  |
| -------- | ----------------------- | ------------------------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Android  | Kotlin/AndroidX WebView | AAB; signed APK for testing/direct distribution                    | Platform-standard Android ABIs       | Customer runner with supported Android SDK/JDK                       | Minimum API 26; target API selected by current signed policy pack (API 36 at project initialization) |
| iOS      | SwiftUI/WKWebView       | Xcode source, `.xcarchive`, provisioned IPA when credentials allow | Apple-supported device architectures | Customer-controlled macOS runner with supported Xcode                | Pinned when the Apple builder milestone begins and maintained in policy/toolchain metadata           |
| Windows  | Tauri 2/WebView2        | Signed MSIX and NSIS installer                                     | x64 initially                        | Windows customer runner                                              | Supported Windows 10 and Windows 11 releases with WebView2                                           |
| macOS    | Tauri 2/WKWebView       | Universal `.app`, notarized DMG                                    | x86_64 and arm64                     | Customer-controlled macOS runner with Xcode and notarization tooling | Pinned when the Apple builder milestone begins                                                       |
| Linux    | Tauri 2/WebKitGTK       | AppImage and `.deb`                                                | x86_64 initially                     | Supported Linux customer runner                                      | Supported Ubuntu and Debian releases pinned in the release policy                                    |

Store-target SDKs, Xcode versions, Linux distributions, and toolchain versions
are maintained as versioned policy/toolchain data rather than permanent prose. A
release records the exact versions used.

## Input support

| Input                         | Support                    | Constraints                                                                                                  |
| ----------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Public URL                    | v1                         | HTTPS; exact verified origins for release builds; bounded redirects and resources                            |
| Prebuilt static ZIP           | v1                         | Must contain `index.html`; 100 MB compressed, 250 MB extracted, 10,000 files by default; no scripts executed |
| Private/authenticated web app | v1 through customer runner | Analysis and build access stay inside customer infrastructure; no credentials sent to hosted analyzer        |
| Git repository                | Not in v1                  | WebToApp does not clone or compile customer source repositories                                              |
| Arbitrary build script        | Not in v1                  | Customer-provided shell, package-manager, Gradle, and similar scripts are not executed                       |
| HTTP or invalid-TLS site      | Unsupported for release    | Production runtimes fail closed                                                                              |

## Capability matrix

| Capability                           |    Android    |       iOS       |              Windows              |              macOS              |                               Linux                               |
| ------------------------------------ | :-----------: | :-------------: | :-------------------------------: | :-----------------------------: | :---------------------------------------------------------------: |
| Exact-origin in-app navigation       |      Yes      |       Yes       |                Yes                |               Yes               |                                Yes                                |
| System-browser OAuth/external links  |      Yes      |       Yes       |                Yes                |               Yes               |                                Yes                                |
| Native navigation chrome             |      Yes      |       Yes       |                Yes                |               Yes               |                                Yes                                |
| Deep/protocol links                  |   App Links   | Universal Links |                Yes                |               Yes               |                                Yes                                |
| Native share                         |      Yes      |       Yes       |                Yes                |               Yes               |                                Yes                                |
| Safe file picker and downloads       |      Yes      |       Yes       |                Yes                |               Yes               |                                Yes                                |
| Camera/microphone/location mediation |      Yes      |       Yes       |     When OS/WebView supports      |    When OS/WebView supports     |                     When OS/WebView supports                      |
| Push reception                       |      FCM      |      APNs       | Deferred after initial desktop GA | Deferred after initial Apple GA |                 Deferred after initial desktop GA                 |
| Native offline/error screens         |      Yes      |       Yes       |                Yes                |               Yes               |                                Yes                                |
| Signed automatic update metadata     | Store channel |  Store channel  |        Direct distribution        |       Direct distribution       | Direct AppImage strategy; package-manager builds defer to manager |

All capabilities default to disabled and must be declared in `AppSpecV1`.
Browser support for a JavaScript API does not imply that its corresponding
native permission is granted.

## Distribution support

- Android signing uses a customer keystore; a separate upload key with Play App
  Signing is recommended.
- Apple signing, provisioning, and notarization use identities in the customer's
  macOS Keychain.
- Windows signing uses the customer's certificate store or selected signing
  provider.
- Linux packages include checksum/signature manifests; repository signing is
  customer-controlled.
- The hosted control plane stores only public fingerprints, labels, and secret
  references.
- v1 produces guided submission/release packs but does not submit to stores
  automatically.

## Unsupported v1 capabilities and outputs

- Arbitrary native plugins, runtime-downloaded modules, and custom native code.
- Biometrics, NFC, geofencing, native payments, and arbitrary background
  execution.
- Full offline mirroring of a remote site.
- Electron packages.
- RPM, Flatpak, Snap, and ARM Linux packages.
- Managed signing-key custody or platform-owned store accounts.
- Guaranteed acceptance by an application store.

## Compatibility outcomes

| Result             | Meaning                                                                             |
| ------------------ | ----------------------------------------------------------------------------------- |
| `ready`            | No known blocking technical or policy issue for the selected targets                |
| `changes_required` | The customer must change the site or configuration before a supported release build |
| `desktop_only`     | The application can be supported on desktop but fails a mobile requirement          |
| `pwa_only`         | Native packaging is inappropriate; installable web delivery is recommended          |
| `unsupported`      | A security, ownership, technical, or product constraint prevents a supported build  |

Compatibility is evidence-based but time-bound. Website changes, OS updates,
WebView releases, and store policies can change the result.
