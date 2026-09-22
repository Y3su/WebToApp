use std::{fs, path::Path};

use serde_json::{json, Value};
use sha2::{Digest, Sha256};

fn tempdir() -> tempfile::TempDir {
    tempfile::tempdir_in(fs::canonicalize(std::env::temp_dir()).unwrap()).unwrap()
}

fn fixture(directory: &Path) -> std::path::PathBuf {
    let path = directory.join("spec.json");
    fs::write(
        &path,
        include_bytes!("../../../packages/app-spec/examples/windows-preview.json"),
    )
    .unwrap();
    path
}

fn export(spec: &Path, destination: &Path) -> Result<String, wta::CliError> {
    wta::execute([
        "wta",
        "build",
        spec.to_str().unwrap(),
        "--target",
        "windows-project",
        "--output-dir",
        destination.to_str().unwrap(),
        "--acknowledge-preview",
        "--json",
    ])
}

#[test]
fn exports_deterministic_snapshots_and_complete_file_hashes() {
    let directory = tempdir();
    let spec = fixture(directory.path());
    let first = directory.path().join("first");
    let second = directory.path().join("second");
    let report: Value = serde_json::from_str(&export(&spec, &first).unwrap()).unwrap();
    export(&spec, &second).unwrap();
    let manifest: Value =
        serde_json::from_slice(&fs::read(first.join("wta.project.json")).unwrap()).unwrap();
    assert_eq!(
        manifest,
        serde_json::from_slice::<Value>(&fs::read(second.join("wta.project.json")).unwrap())
            .unwrap()
    );
    assert_eq!(manifest["appSpecSha256"], report["appSpecSha256"]);
    assert_eq!(manifest["releaseAuthorized"], false);
    let inventory = manifest["files"].as_object().unwrap();
    assert!(inventory.len() >= 20);
    for (path, digest) in inventory {
        let bytes = fs::read(first.join(path)).unwrap();
        assert_eq!(
            digest,
            &json!(format!("{:x}", Sha256::digest(&bytes))),
            "{path}"
        );
        assert_eq!(bytes, fs::read(second.join(path)).unwrap(), "{path}");
    }
    assert_eq!(
        inventory["src-tauri/resources/appspec.json"],
        manifest["appSpecSha256"]
    );
    let original = fs::read(first.join("src-tauri/resources/appspec.json")).unwrap();
    fs::write(&spec, b"input replaced after export").unwrap();
    assert_eq!(
        original,
        fs::read(first.join("src-tauri/resources/appspec.json")).unwrap()
    );
}

#[test]
fn requires_acknowledgement_and_never_reuses_output_directories() {
    let directory = tempdir();
    let spec = fixture(directory.path());
    let output = directory.path().join("output");
    let base = [
        "wta",
        "build",
        spec.to_str().unwrap(),
        "--target",
        "windows-project",
        "--output-dir",
        output.to_str().unwrap(),
    ];
    assert!(wta::execute(base).is_err());
    assert!(!output.exists());
    assert!(wta::execute(base.into_iter().chain(["--acknowledge-preview", "--force"])).is_err());
    assert!(!output.exists());
    fs::create_dir(&output).unwrap();
    fs::write(output.join("keep.txt"), b"user data").unwrap();
    assert!(export(&spec, &output).is_err());
    assert_eq!(fs::read(output.join("keep.txt")).unwrap(), b"user data");
    assert_eq!(fs::read_dir(&output).unwrap().count(), 1);
}

#[test]
fn rejects_unsupported_capabilities_before_writing() {
    let directory = tempdir();
    let spec = fixture(directory.path());
    let baseline: Value = serde_json::from_slice(&fs::read(&spec).unwrap()).unwrap();
    for (index, (pointer, value)) in [
        (
            "/capabilities/share",
            json!({"enabled": true, "rationale": "Native sharing is requested."}),
        ),
        ("/release/channel", json!("stable")),
        ("/release/updatePolicy", json!("store")),
        (
            "/source",
            json!({"kind": "static", "artifactSha256": "a".repeat(64)}),
        ),
        (
            "/navigation/native",
            json!({"mode": "tabs", "items": [{"id": "home", "label": "Home", "url": "https://example.com", "icon": "home"}]}),
        ),
        (
            "/navigation/oauthOrigins",
            json!(["https://accounts.example.com"]),
        ),
        ("/navigation/externalLinks", json!("system")),
        ("/targets/windows/architectures", json!(["arm64"])),
    ]
    .into_iter()
    .enumerate()
    {
        let mut value_spec = baseline.clone();
        *value_spec.pointer_mut(pointer).unwrap() = value;
        fs::write(&spec, serde_json::to_vec(&value_spec).unwrap()).unwrap();
        let output = directory.path().join(format!("case-{index}"));
        assert!(
            matches!(export(&spec, &output), Err(wta::CliError::Unsupported(_))),
            "{pointer}"
        );
        assert!(!output.exists());
    }
}

#[test]
fn display_names_remain_json_data_not_paths_or_commands() {
    let directory = tempdir();
    let spec = fixture(directory.path());
    let mut value: Value = serde_json::from_slice(&fs::read(&spec).unwrap()).unwrap();
    let name = "../evil; $(calc) <script>";
    value["identity"]["displayName"] = json!(name);
    fs::write(&spec, serde_json::to_vec(&value).unwrap()).unwrap();
    let output = directory.path().join("output");
    export(&spec, &output).unwrap();
    let config: Value =
        serde_json::from_slice(&fs::read(output.join("src-tauri/tauri.conf.json")).unwrap())
            .unwrap();
    assert_eq!(config["productName"], "WebToApp Preview");
    assert_eq!(config["build"]["beforeBuildCommand"], "pnpm build");
    assert_eq!(config["bundle"]["active"], false);
    let package: Value =
        serde_json::from_slice(&fs::read(output.join("package.json")).unwrap()).unwrap();
    assert_eq!(
        package["scripts"]["desktop"],
        "tauri build --debug --no-bundle --target x86_64-pc-windows-msvc -- --locked"
    );
    let frozen: Value =
        serde_json::from_slice(&fs::read(output.join("src-tauri/resources/appspec.json")).unwrap())
            .unwrap();
    assert_eq!(frozen["identity"]["displayName"], name);
    assert!(!directory.path().join("evil").exists());
    let permissions: Value = serde_json::from_slice(
        &fs::read(output.join("src-tauri/capabilities/local-shell.json")).unwrap(),
    )
    .unwrap();
    assert_eq!(permissions["windows"], json!(["main"]));
}
