use std::{collections::BTreeMap, fs, path::Path};

use serde_json::{json, Value};

use crate::{
    cli::BuildArgs,
    digest::{canonical_json_bytes, sha256_bytes},
    error::CliError,
    safe_io::{ensure_output_directory, validate_path_syntax, write_regular_file},
    spec::{
        ExternalLinks, NativeNavigationMode, ReleaseChannel, Source, UpdatePolicy, ValidatedSpec,
    },
};

macro_rules! runtime_text {
    ($path:literal) => {
        include_str!(concat!("../../../runtimes/desktop/", $path))
    };
}

pub fn export_windows(validated: &ValidatedSpec, args: &BuildArgs) -> Result<String, CliError> {
    check_preview(validated, args)?;
    // Every destination is a compile-time constant; spec strings are only JSON data.
    let files = project_files(validated)?;
    validate_path_syntax(&args.output_dir)?;
    let parent = args
        .output_dir
        .parent()
        .filter(|path| !path.as_os_str().is_empty())
        .unwrap_or_else(|| Path::new("."));
    ensure_output_directory(parent)?;
    // Exclusive creation: even an empty existing directory is never reused.
    fs::create_dir(&args.output_dir).map_err(|source| CliError::Write {
        path: args.output_dir.clone(),
        source,
    })?;
    let directory = ensure_output_directory(&args.output_dir)?;
    let mut inventory = BTreeMap::new();
    for (name, bytes) in files {
        write_regular_file(&directory.join(name), &bytes, false)?;
        inventory.insert(name, sha256_bytes(&bytes));
    }
    let manifest = json!({
        "formatVersion": "1.0",
        "target": "windows-project",
        "generatorVersion": env!("CARGO_PKG_VERSION"),
        "appSpecSha256": validated.digest,
        "releaseAuthorized": false,
        "signed": false,
        "files": inventory,
    });
    write_regular_file(
        &directory.join("wta.project.json"),
        &encode(&manifest)?,
        false,
    )?;
    if args.json {
        String::from_utf8(encode(&json!({
            "outputDirectory": directory,
            "appSpecSha256": validated.digest,
            "target": "windows-project",
            "releaseAuthorized": false,
        }))?)
        .map_err(|error| CliError::InvalidSpec(error.to_string()))
    } else {
        Ok(format!("Exported unsigned local Windows preview to {}\nNo build, network request or signing operation was executed. See its README.md.", directory.display()))
    }
}

fn check_preview(validated: &ValidatedSpec, args: &BuildArgs) -> Result<(), CliError> {
    let spec = &validated.spec;
    if !args.acknowledge_preview || args.force {
        return Err(CliError::Validation(
            "windows-project requires --acknowledge-preview and never accepts --force".into(),
        ));
    }
    let supported = matches!(spec.source, Source::Url { .. })
        && matches!(spec.release.channel, ReleaseChannel::Internal)
        && matches!(spec.release.update_policy, UpdatePolicy::Manual)
        && !spec.capabilities.any_enabled()
        && spec.navigation.native.mode == NativeNavigationMode::None
        && spec.navigation.oauth_origins.is_empty()
        && matches!(spec.navigation.external_links, ExternalLinks::Block)
        && spec.targets.enabled_names() == ["windows"]
        && spec
            .targets
            .windows
            .as_ref()
            .is_some_and(|target| target["architectures"] == json!(["x64"]));
    if !supported {
        return Err(CliError::Unsupported(
            "Windows project preview supports only HTTPS URL sources, internal/manual release, Windows x64, blocked external links, no OAuth/native navigation and no enabled capabilities".into(),
        ));
    }
    Ok(())
}

fn project_files(validated: &ValidatedSpec) -> Result<BTreeMap<&'static str, Vec<u8>>, CliError> {
    let mut files = BTreeMap::new();
    for (name, text) in [
        (
            "package.json",
            runtime_text!("project-template/package.json"),
        ),
        (
            "pnpm-workspace.yaml",
            runtime_text!("project-template/pnpm-workspace.yaml"),
        ),
        (
            "pnpm-lock.yaml",
            runtime_text!("project-template/pnpm-lock.yaml"),
        ),
        (
            "tsconfig.json",
            runtime_text!("project-template/tsconfig.json"),
        ),
        ("README.md", runtime_text!("project-template/README.md")),
        ("index.html", runtime_text!("index.html")),
        ("vite.config.ts", runtime_text!("vite.config.ts")),
        ("src/main.ts", runtime_text!("src/main.ts")),
        ("src/styles.css", runtime_text!("src/styles.css")),
        (
            "src-tauri/Cargo.lock",
            runtime_text!("src-tauri/Cargo.lock"),
        ),
        ("src-tauri/build.rs", runtime_text!("src-tauri/build.rs")),
        (
            "src-tauri/src/main.rs",
            runtime_text!("src-tauri/src/main.rs"),
        ),
        (
            "src-tauri/src/lib.rs",
            runtime_text!("src-tauri/src/lib.rs"),
        ),
        (
            "src-tauri/src/config.rs",
            runtime_text!("src-tauri/src/config.rs"),
        ),
        (
            "src-tauri/src/permissions.rs",
            runtime_text!("src-tauri/src/permissions.rs"),
        ),
        (
            "src-tauri/capabilities/local-shell.json",
            runtime_text!("src-tauri/capabilities/local-shell.json"),
        ),
        (
            "rust-toolchain.toml",
            include_str!("../../../rust-toolchain.toml"),
        ),
        ("LICENSE", include_str!("../../../LICENSE")),
        ("NOTICE", include_str!("../../../NOTICE")),
        (
            ".gitignore",
            "node_modules/\ndist/\nsrc-tauri/target/\nsrc-tauri/gen/\n",
        ),
    ] {
        files.insert(name, text.replace("\r\n", "\n").into_bytes());
    }
    files.insert(
        "src-tauri/Cargo.toml",
        format!(
            "{}\n[workspace]\n",
            runtime_text!("src-tauri/Cargo.toml").replace("\r\n", "\n")
        )
        .into_bytes(),
    );
    for (name, bytes) in [
        (
            "src-tauri/icons/icon.ico",
            include_bytes!("../../../runtimes/desktop/src-tauri/icons/icon.ico").as_slice(),
        ),
        (
            "src-tauri/icons/icon.png",
            include_bytes!("../../../runtimes/desktop/src-tauri/icons/icon.png").as_slice(),
        ),
    ] {
        files.insert(name, bytes.to_vec());
    }
    let mut config: Value = serde_json::from_str(runtime_text!("src-tauri/tauri.conf.json"))
        .map_err(|error| CliError::InvalidSpec(error.to_string()))?;
    config["productName"] = json!("WebToApp Preview");
    config["version"] = json!(validated.spec.identity.version);
    config["identifier"] = json!(validated.spec.identity.platform_identifiers.windows);
    config["bundle"]["active"] = json!(false);
    files.insert("src-tauri/tauri.conf.json", encode(&config)?);
    let spec = serde_json::to_value(&validated.spec)
        .map_err(|error| CliError::InvalidSpec(error.to_string()))?;
    files.insert(
        "src-tauri/resources/appspec.json",
        canonical_json_bytes(&spec)?,
    );
    Ok(files)
}

fn encode(value: &Value) -> Result<Vec<u8>, CliError> {
    serde_json::to_vec_pretty(value).map_err(|error| CliError::InvalidSpec(error.to_string()))
}
