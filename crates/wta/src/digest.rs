use std::{
    fs::File,
    io::{BufReader, Read},
    path::Path,
};

use serde_json::Value;
use sha2::{Digest, Sha256};

use crate::error::CliError;

#[must_use]
pub fn sha256_bytes(bytes: &[u8]) -> String {
    hex_digest(Sha256::digest(bytes).as_slice())
}

pub fn sha256_file(path: &Path) -> Result<(String, u64), CliError> {
    let metadata = std::fs::symlink_metadata(path).map_err(|source| CliError::Read {
        path: path.to_path_buf(),
        source,
    })?;
    if metadata.file_type().is_symlink() {
        return Err(CliError::UnsafePath {
            path: path.to_path_buf(),
            reason: "symbolic links are not accepted as artifacts".into(),
        });
    }
    if !metadata.is_file() {
        return Err(CliError::UnsafePath {
            path: path.to_path_buf(),
            reason: "artifact must be a regular file".into(),
        });
    }

    let file = File::open(path).map_err(|source| CliError::Read {
        path: path.to_path_buf(),
        source,
    })?;
    let mut reader = BufReader::new(file);
    let mut hasher = Sha256::new();
    let mut buffer = vec![0_u8; 64 * 1024].into_boxed_slice();
    let mut size = 0_u64;
    loop {
        let read = reader.read(&mut buffer).map_err(|source| CliError::Read {
            path: path.to_path_buf(),
            source,
        })?;
        if read == 0 {
            break;
        }
        let chunk_size = u64::try_from(read).map_err(|_| {
            CliError::Integrity("artifact length cannot be represented safely".into())
        })?;
        size = size.checked_add(chunk_size).ok_or_else(|| {
            CliError::Integrity("artifact length exceeds the supported range".into())
        })?;
        hasher.update(&buffer[..read]);
    }
    Ok((hex_digest(hasher.finalize().as_slice()), size))
}

pub fn canonical_json_bytes(value: &Value) -> Result<Vec<u8>, CliError> {
    let canonical = canonicalize(value);
    serde_json::to_vec(&canonical)
        .map_err(|error| CliError::InvalidSpec(format!("cannot canonicalize JSON: {error}")))
}

fn canonicalize(value: &Value) -> Value {
    match value {
        Value::Object(map) => {
            let mut entries: Vec<_> = map.iter().collect();
            entries.sort_unstable_by(|(left, _), (right, _)| left.cmp(right));
            let mut sorted = serde_json::Map::with_capacity(entries.len());
            for (key, item) in entries {
                sorted.insert(key.clone(), canonicalize(item));
            }
            Value::Object(sorted)
        }
        Value::Array(items) => Value::Array(items.iter().map(canonicalize).collect()),
        _ => value.clone(),
    }
}

fn hex_digest(bytes: &[u8]) -> String {
    use std::fmt::Write as _;

    let mut output = String::with_capacity(bytes.len() * 2);
    for byte in bytes {
        let _ = write!(output, "{byte:02x}");
    }
    output
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::{canonical_json_bytes, sha256_bytes};

    #[test]
    fn canonical_json_sorts_nested_keys() {
        let left = json!({"z": 1, "a": {"y": 2, "b": 3}});
        let right = json!({"a": {"b": 3, "y": 2}, "z": 1});
        assert_eq!(
            canonical_json_bytes(&left).unwrap(),
            canonical_json_bytes(&right).unwrap()
        );
    }

    #[test]
    fn hashes_known_value() {
        assert_eq!(
            sha256_bytes(b"hello"),
            "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
        );
    }
}
