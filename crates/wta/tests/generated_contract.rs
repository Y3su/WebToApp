// Generated models are checked through the same serialized fixtures as the CLI.
#[allow(dead_code, clippy::all, clippy::pedantic)]
#[path = "../../../packages/app-spec/generated/app_spec_v1.rs"]
mod generated;

#[test]
fn generated_rust_model_decodes_canonical_examples() {
    for content in [
        include_str!("../../../packages/app-spec/examples/url-app.json"),
        include_str!("../../../packages/app-spec/examples/static-app.json"),
    ] {
        let spec: generated::AppSpecV1 = serde_json::from_str(content).unwrap();
        assert_eq!(serde_json::to_value(spec.schema_version).unwrap(), "1.0");
    }
}
