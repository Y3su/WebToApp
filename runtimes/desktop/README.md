# WebToApp desktop runtime

This Tauri runtime creates a top-level remote WebView from a build-time
`appspec.json`. Remote content receives no Tauri capabilities or generic IPC.
Only the trusted local shell can invoke local runtime commands.

The customer runner will copy a frozen AppSpec revision into
`src-tauri/resources/appspec.json`, set platform metadata, and invoke Tauri's
platform-specific bundler. Never place signing material in this directory.
