mod config;

use std::path::PathBuf;

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

            WebviewWindowBuilder::new(app, "webapp", WebviewUrl::External(start_url))
                .title(title)
                .inner_size(1200.0, 800.0)
                .on_navigation(move |candidate| spec.is_navigation_allowed(candidate))
                .on_new_window(|_, _| tauri::webview::NewWindowResponse::Deny)
                .build()?;

            if let Some(shell) = app.get_webview_window("main") {
                shell.emit("webtoapp://runtime-ready", ())?;
                shell.hide()?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("WebToApp desktop runtime failed");
}
