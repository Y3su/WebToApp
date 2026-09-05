use std::fs;

use tempfile::tempdir;

#[test]
fn init_works_with_its_default_relative_output() {
    let directory = tempdir().unwrap();
    let output = std::process::Command::new(env!("CARGO_BIN_EXE_wta"))
        .current_dir(directory.path())
        .args(["init", "--name", "Example", "--url", "https://example.com"])
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    assert!(directory.path().join("webtoapp.json").is_file());
}

#[test]
fn init_validate_analyze_and_build_are_consistent() {
    let directory = tempdir().unwrap();
    let spec = directory.path().join("webtoapp.json");
    let dist = directory.path().join("dist");

    let init = wta::execute([
        "wta",
        "init",
        "--name",
        "Example Portal",
        "--url",
        "https://example.com/app",
        "--output",
        spec.to_str().unwrap(),
    ])
    .unwrap();
    assert!(init.contains("Created"));
    assert!(
        wta::execute(["wta", "validate", spec.to_str().unwrap()]).is_err(),
        "a draft must not pretend ownership has been verified"
    );
    let mut document: serde_json::Value =
        serde_json::from_slice(&fs::read(&spec).unwrap()).unwrap();
    document["ownership"] = serde_json::json!({
        "verifiedDomains": ["example.com"], "verificationRecordIds": ["fixture-verification"]
    });
    fs::write(&spec, serde_json::to_vec(&document).unwrap()).unwrap();

    let validation = wta::execute(["wta", "validate", spec.to_str().unwrap(), "--json"]).unwrap();
    assert!(validation.contains("\"valid\": true"));
    assert!(validation.contains("\"windows\""));

    let analysis = wta::execute(["wta", "analyze", spec.to_str().unwrap(), "--json"]).unwrap();
    assert!(analysis.contains("changes_required"));
    assert!(analysis.contains("store.native_value_missing"));

    wta::execute([
        "wta",
        "build",
        spec.to_str().unwrap(),
        "--output-dir",
        dist.to_str().unwrap(),
    ])
    .unwrap();
    let artifact = dist.join("webtoapp.windows-dev.manifest.json");
    let first = fs::read(&artifact).unwrap();

    wta::execute([
        "wta",
        "build",
        spec.to_str().unwrap(),
        "--output-dir",
        dist.to_str().unwrap(),
        "--force",
    ])
    .unwrap();
    let second = fs::read(&artifact).unwrap();
    assert_eq!(first, second, "developer artifact must be deterministic");

    let verification = wta::execute([
        "wta",
        "artifact",
        "verify",
        artifact.to_str().unwrap(),
        "--json",
    ])
    .unwrap();
    assert!(verification.contains("sha256"));
}

#[test]
fn init_rejects_cleartext_and_private_urls_without_writing() {
    let directory = tempdir().unwrap();
    for (index, url) in [
        "http://example.com",
        "https://127.0.0.1",
        "https://service.internal",
    ]
    .into_iter()
    .enumerate()
    {
        let spec = directory.path().join(format!("unsafe-{index}.json"));
        let result = wta::execute([
            "wta",
            "init",
            "--name",
            "Unsafe",
            "--url",
            url,
            "--output",
            spec.to_str().unwrap(),
        ]);
        assert!(result.is_err(), "{url}");
        assert!(!spec.exists(), "unsafe init must not write state");
    }
}

#[test]
fn runner_skeleton_never_claims_enrollment() {
    let directory = tempdir().unwrap();
    let state = directory.path().join("runner-state");
    let error = wta::execute([
        "wta",
        "runner",
        "enroll",
        "--control-plane",
        "https://control.example.com",
        "--organization",
        "org_123",
        "--state-dir",
        state.to_str().unwrap(),
    ])
    .unwrap_err();
    assert_eq!(error.exit_code(), 6);
    assert!(error.to_string().contains("no request was sent"));
    assert!(!state.exists());
}

#[test]
fn artifact_verify_fails_on_digest_mismatch() {
    let directory = tempdir().unwrap();
    let artifact = directory.path().join("artifact.bin");
    fs::write(&artifact, b"artifact").unwrap();
    let error = wta::execute([
        "wta",
        "artifact",
        "verify",
        artifact.to_str().unwrap(),
        "--sha256",
        &"0".repeat(64),
    ])
    .unwrap_err();
    assert_eq!(error.exit_code(), 5);
}
