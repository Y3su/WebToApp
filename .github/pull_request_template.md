## Summary

<!-- Explain the user-visible behavior and why the change is needed. -->

## Security and compatibility

- [ ] I treated URLs, archives, web content, manifests, and runner input as
      untrusted.
- [ ] I did not add credentials, customer content, signing material, or release
      artifacts.
- [ ] I updated the threat model or an ADR if a trust boundary changed.
- [ ] I added regression tests for security-sensitive behavior.

## Verification

- [ ] `pnpm check`
- [ ] `cargo fmt --all --check`
- [ ] `cargo clippy --workspace --all-targets --all-features -- -D warnings`
- [ ] `cargo test --workspace --all-features`
- [ ] Platform-specific tests, if applicable
