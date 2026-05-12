use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppErrorInfo {
  pub code: String,
  pub title: String,
  pub message: String,
  pub severity: String,
  pub operation: Option<String>,
  pub path: Option<String>,
  pub recoverable: bool,
  pub suggested_action: Option<String>,
  pub timestamp: String,
}

pub fn operation_error(code: &str, message: impl Into<String>, operation: &str) -> AppErrorInfo {
  AppErrorInfo {
    code: code.to_string(),
    title: "Operation failed".to_string(),
    message: message.into(),
    severity: "error".to_string(),
    operation: Some(operation.to_string()),
    path: None,
    recoverable: true,
    suggested_action: Some("Retry after checking project paths and logs.".to_string()),
    timestamp: crate::now_string(),
  }
}
