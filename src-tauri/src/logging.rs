use std::{fs, path::Path};

pub fn append_log(project_root: Option<&str>, event: &str, message: &str) -> Result<(), String> {
  let Some(root) = project_root else {
    return Ok(());
  };
  let log_dir = Path::new(root).join("logs");
  fs::create_dir_all(&log_dir).map_err(|error| error.to_string())?;
  let line = format!("{} [{}] {}\n", crate::now_string(), event, redact(message));
  fs::write(log_dir.join("redux_ai.log"), line).map_err(|error| error.to_string())
}

fn redact(value: &str) -> String {
  value.replace("apiKey", "apiKey=[redacted]").replace("Authorization", "Authorization=[redacted]")
}
