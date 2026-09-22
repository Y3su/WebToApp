//! OS permission policy must be installed before any untrusted navigation.

#[cfg(windows)]
#[allow(unsafe_code)] // Narrow COM boundary; all other runtime code denies unsafe.
pub fn install_preview_policy(
    view: &tauri::webview::PlatformWebview,
) -> Result<(), Box<dyn std::error::Error>> {
    use webview2_com::{
        Microsoft::Web::WebView2::Win32::COREWEBVIEW2_PERMISSION_STATE_DENY,
        PermissionRequestedEventHandler,
    };

    // SAFETY: Tauri invokes with_webview on the owning UI thread. The controller
    // and returned COM interfaces are reference-counted and valid for these
    // calls. WebView2 retains the registered callback; it contains no borrowed
    // state and uses event arguments only during their callback lifetime.
    unsafe {
        let webview = view.controller().CoreWebView2()?;
        let settings = webview.Settings()?;
        settings.SetAreDevToolsEnabled(false)?;
        settings.SetAreDefaultContextMenusEnabled(false)?;
        let mut token = 0;
        webview.add_PermissionRequested(
            &PermissionRequestedEventHandler::create(Box::new(|_, args| {
                // Failure cannot fall through to the browser's default prompt.
                let Some(args) = args else {
                    std::process::abort()
                };
                args.SetState(COREWEBVIEW2_PERMISSION_STATE_DENY)
                    .unwrap_or_else(|_| std::process::abort());
                Ok(())
            })),
            &raw mut token,
        )?;
    }
    Ok(())
}

#[cfg(not(windows))]
pub fn install_preview_policy(
    _view: &tauri::webview::PlatformWebview,
) -> Result<(), Box<dyn std::error::Error>> {
    Err(std::io::Error::new(
        std::io::ErrorKind::Unsupported,
        "desktop preview permission enforcement is currently Windows-only",
    )
    .into())
}
