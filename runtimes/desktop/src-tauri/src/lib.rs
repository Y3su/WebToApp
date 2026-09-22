mod config;
mod permissions;

use std::{
    path::PathBuf,
    sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    },
};

use config::RuntimeSpec;
use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

/// Start the restricted desktop shell.
///
/// # Panics
/// Panics when the bundled configuration or native webview cannot initialize.
pub fn run() {
    tauri::Builder::default()
        .on_window_event(|window, event| {
            if window.label() == "webapp"
                && matches!(event, tauri::WindowEvent::CloseRequested { .. })
            {
                window.app_handle().exit(0);
            }
        })
        .setup(|app| {
            let resource_path: PathBuf = app.path().resolve(
                "resources/appspec.json",
                tauri::path::BaseDirectory::Resource,
            )?;
            let spec = RuntimeSpec::load(&resource_path)?;
            let title = spec.identity.display_name.clone();
            let start_url = spec.start_url().clone();

            let ready = Arc::new(AtomicBool::new(false));
            let navigation_ready = Arc::clone(&ready);
            let window = WebviewWindowBuilder::new(
                app,
                "webapp",
                WebviewUrl::External(url::Url::parse("about:blank")?),
            )
            .title(title)
            .inner_size(1200.0, 800.0)
            .visible(false)
            // Never reuse an earlier browser permission grant or persistent cookies.
            .incognito(true)
            .on_navigation(move |candidate| {
                candidate.as_str() == "about:blank"
                    || (navigation_ready.load(Ordering::Acquire)
                        && spec.is_navigation_allowed(candidate))
            })
            .on_new_window(|_, _| tauri::webview::NewWindowResponse::Deny)
            .on_download(|_, _| false)
            .build()?;

            let remote = window.clone();
            window.with_webview(move |platform| {
                if permissions::install_preview_policy(&platform).is_err() {
                    remote.app_handle().exit(1);
                    return;
                }
                ready.store(true, Ordering::Release);
                if remote
                    .navigate(start_url)
                    .and_then(|()| remote.show())
                    .is_err()
                {
                    remote.app_handle().exit(1);
                    return;
                }
                if let Some(shell) = remote.app_handle().get_webview_window("main") {
                    let _ = shell.emit("webtoapp://runtime-ready", ());
                    let _ = shell.hide();
                }
            })?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("WebToApp desktop runtime failed");
}
