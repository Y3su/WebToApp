use std::{fs, path::Path};

use serde::Deserialize;
use thiserror::Error;
use url::Url;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeSpec {
    pub schema_version: String,
    pub identity: Identity,
    pub source: Source,
    pub navigation: Navigation,
    pub ownership: Ownership,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Identity {
    pub display_name: String,
}

#[derive(Debug, Deserialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum Source {
    Url { start_url: Url },
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Navigation {
    pub allowed_origins: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Ownership {
    pub verified_domains: Vec<String>,
}

#[derive(Debug, Error)]
pub enum ConfigError {
    #[error("runtime configuration could not be read")]
    Read(#[source] std::io::Error),
    #[error("runtime configuration is invalid")]
    Parse(#[source] serde_json::Error),
    #[error("unsupported AppSpec schema version")]
    SchemaVersion,
    #[error("start URL must use HTTPS")]
    InsecureUrl,
    #[error("start URL origin is not allowed")]
    DisallowedOrigin,
    #[error("origin must be canonical and its hostname must be verified")]
    UnverifiedOrigin,
}

impl RuntimeSpec {
    pub fn load(path: &Path) -> Result<Self, ConfigError> {
        let bytes = fs::read(path).map_err(ConfigError::Read)?;
        let spec: Self = serde_json::from_slice(&bytes).map_err(ConfigError::Parse)?;
        spec.validate()?;
        Ok(spec)
    }

    pub fn validate(&self) -> Result<(), ConfigError> {
        if self.schema_version != "1.0" {
            return Err(ConfigError::SchemaVersion);
        }
        for origin in &self.navigation.allowed_origins {
            let parsed = Url::parse(origin).map_err(|_| ConfigError::UnverifiedOrigin)?;
            if parsed.origin().ascii_serialization() != *origin
                || !self
                    .ownership
                    .verified_domains
                    .iter()
                    .any(|domain| Some(domain.as_str()) == parsed.host_str())
            {
                return Err(ConfigError::UnverifiedOrigin);
            }
        }

        let Source::Url { start_url } = &self.source;
        if start_url.scheme() != "https"
            || !start_url.username().is_empty()
            || start_url.password().is_some()
        {
            return Err(ConfigError::InsecureUrl);
        }

        if !self.is_navigation_allowed(start_url) {
            return Err(ConfigError::DisallowedOrigin);
        }
        Ok(())
    }

    pub fn start_url(&self) -> &Url {
        let Source::Url { start_url } = &self.source;
        start_url
    }

    pub fn is_navigation_allowed(&self, candidate: &Url) -> bool {
        if candidate.scheme() != "https"
            || !candidate.username().is_empty()
            || candidate.password().is_some()
        {
            return false;
        }

        self.navigation.allowed_origins.iter().any(|allowed| {
            Url::parse(allowed)
                .ok()
                .filter(|origin| {
                    origin.scheme() == "https"
                        && origin.username().is_empty()
                        && origin.password().is_none()
                        && origin.path() == "/"
                        && origin.query().is_none()
                        && origin.fragment().is_none()
                })
                .is_some_and(|origin| origin.origin() == candidate.origin())
        })
    }
}

#[cfg(test)]
mod tests {
    use super::{Identity, Navigation, Ownership, RuntimeSpec, Source};
    use url::Url;

    fn spec() -> RuntimeSpec {
        RuntimeSpec {
            ownership: Ownership {
                verified_domains: vec!["app.example.test".to_owned()],
            },
            schema_version: "1.0".to_owned(),
            identity: Identity {
                display_name: "Example".to_owned(),
            },
            source: Source::Url {
                start_url: Url::parse("https://app.example.test/start").unwrap(),
            },
            navigation: Navigation {
                allowed_origins: vec!["https://app.example.test".to_owned()],
            },
        }
    }

    #[test]
    fn exact_origin_allows_paths() {
        let runtime = spec();
        let candidate = Url::parse("https://app.example.test/another?q=1").unwrap();
        assert!(runtime.is_navigation_allowed(&candidate));
    }

    #[test]
    fn rejects_subdomains_and_userinfo_confusion() {
        let runtime = spec();
        assert!(
            !runtime.is_navigation_allowed(&Url::parse("https://evil.app.example.test").unwrap())
        );
        assert!(
            !runtime
                .is_navigation_allowed(&Url::parse("https://app.example.test@evil.test").unwrap())
        );
    }
}
