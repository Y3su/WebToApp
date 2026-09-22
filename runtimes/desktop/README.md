# WebToApp desktop runtime

This Tauri runtime creates a top-level remote WebView from a build-time
`appspec.json`. Remote content receives no Tauri capabilities or generic IPC.
Only the trusted local shell can invoke local runtime commands.

The Windows preview starts blank, installs a deny-all WebView2 permission
handler, then navigates to the allowed URL in an in-private session. Downloads
and popups are blocked. Cookies do not persist across sessions. Native COM calls
are confined to `permissions.rs`; Tauri and WebView2 bindings are pinned
together. Linux/macOS navigation fails closed pending equivalent native guards.
Real browser permission-event tests, file-input policy and subresource controls
remain production acceptance work.

`wta build --target windows-project --acknowledge-preview` exports this runtime
with a frozen AppSpec and fixed build scripts; see the
[CLI guide](../../crates/wta/README.md). The future customer runner will verify
ownership, apply signing references and invoke platform-specific bundlers. Never
place signing material in this directory.
