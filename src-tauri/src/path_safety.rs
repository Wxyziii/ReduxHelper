use std::path::{Component, Path, PathBuf};

pub fn normalize_relative_path(path: &str) -> String {
  path
    .replace('\\', "/")
    .split('/')
    .filter(|part| !part.is_empty() && *part != "." && *part != "..")
    .collect::<Vec<_>>()
    .join("/")
}

pub fn has_path_traversal(path: &Path) -> bool {
  path.components().any(|component| matches!(component, Component::ParentDir))
}

pub fn ensure_inside(base: &Path, candidate: &Path) -> Result<PathBuf, String> {
  if has_path_traversal(candidate) {
    return Err("Path traversal is blocked.".to_string());
  }
  let base = base.canonicalize().map_err(|error| error.to_string())?;
  let canonical = candidate.canonicalize().map_err(|error| error.to_string())?;
  if canonical.starts_with(&base) {
    Ok(canonical)
  } else {
    Err("Path is outside allowed folder.".to_string())
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn normalize_removes_traversal() {
    assert_eq!(normalize_relative_path("../common/./data/file.xml"), "common/data/file.xml");
  }

  #[test]
  fn detects_parent_component() {
    assert!(has_path_traversal(Path::new("../bad")));
    assert!(!has_path_traversal(Path::new("good/file.xml")));
  }
}
