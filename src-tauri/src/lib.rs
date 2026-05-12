use serde::{Deserialize, Serialize};
use std::{
  collections::HashMap,
  fs,
  path::{Path, PathBuf},
  process::Command,
  time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tauri::Manager;
use walkdir::WalkDir;

pub mod errors;
pub mod logging;
pub mod path_safety;

type CommandResult<T> = Result<T, String>;

const APP_VERSION: &str = "0.2.0";

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct ReduxProject {
  version: String,
  project_id: String,
  project_name: String,
  created_at: String,
  updated_at: String,
  save_status: String,
  notes: String,
  project_root: Option<String>,
  project_json_path: Option<String>,
  workspace_path: Option<String>,
  sections: HashMap<String, ProjectSection>,
  files: Vec<ProjectFile>,
  #[serde(default)]
  ai_history: Vec<serde_json::Value>,
  #[serde(default)]
  ai_suggestions: Vec<serde_json::Value>,
  #[serde(default)]
  patch_reviews: Vec<serde_json::Value>,
  #[serde(default)]
  applied_patches: Vec<serde_json::Value>,
  #[serde(default)]
  backups: Vec<serde_json::Value>,
  #[serde(default)]
  changelog_entries: Vec<serde_json::Value>,
  #[serde(default)]
  patch_batches: Vec<serde_json::Value>,
  #[serde(default)]
  ai_responses: Vec<serde_json::Value>,
  #[serde(default)]
  patches: Vec<serde_json::Value>,
  #[serde(default)]
  textures: Vec<serde_json::Value>,
  #[serde(default)]
  export_history: Vec<serde_json::Value>,
  #[serde(default)]
  image_generation_history: Vec<serde_json::Value>,
  #[serde(default)]
  prompt_basket: Vec<serde_json::Value>,
  #[serde(default)]
  diagnostics: Vec<serde_json::Value>,
  last_indexed_at: Option<String>,
  #[serde(default)]
  scan_cache: serde_json::Value,
  #[serde(default)]
  operation_history: Vec<serde_json::Value>,
  settings: serde_json::Value,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProjectSection {
  id: String,
  name: String,
  description: String,
  goal: String,
  warnings: Vec<String>,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProjectFile {
  id: String,
  source_path: String,
  workspace_path: String,
  relative_path: String,
  file_name: String,
  extension: String,
  size_bytes: u64,
  status: String,
  section: String,
  warnings: Vec<String>,
  scan_matches: Vec<ScanMatch>,
  preview: Option<String>,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct TextureMetadata {
  file_path: String,
  filename: String,
  width: Option<u32>,
  height: Option<u32>,
  format: Option<String>,
  mipmap_count: Option<u32>,
  has_alpha: Option<String>,
  file_size_bytes: u64,
  role_guess: String,
  warnings: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct TextureToolCheck {
  ok: bool,
  converter_path: String,
  exists: bool,
  can_run: bool,
  version_output: Option<String>,
  warning: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct TextureConversionResult {
  success: bool,
  texture_id: String,
  source_path: String,
  output_path: Option<String>,
  metadata: Option<TextureMetadata>,
  warnings: Vec<String>,
  command_output: Option<String>,
  error: Option<String>,
}

struct TextReadResult {
  text: String,
  warning: Option<String>,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct ScanMatch {
  file_path: String,
  line: usize,
  keyword: String,
  snippet: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CommandResponse {
  ok: bool,
  action: &'static str,
  message: String,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct OpenRouterMessage {
  role: String,
  content: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct OpenRouterRequest {
  api_key: String,
  base_url: String,
  model: String,
  messages: Vec<OpenRouterMessage>,
  temperature: f64,
  max_tokens: u32,
  timeout_seconds: u64,
  site_url: Option<String>,
  app_name: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct OpenRouterResponse {
  ok: bool,
  raw_response_text: String,
  assistant_content: String,
  model_used: String,
  request_ms: u128,
  error: Option<String>,
  status_code: Option<u16>,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct AiPatchPayload {
  find: String,
  replace: String,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct AiSuggestionPatch {
  id: String,
  title: String,
  reason: String,
  risk: String,
  target_file_path: String,
  change_type: String,
  patch: Option<AiPatchPayload>,
  manual_steps: Option<Vec<String>>,
  testing_notes: Option<Vec<String>>,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct PatchReviewState {
  id: String,
  suggestion_id: String,
  section: String,
  suggestion: AiSuggestionPatch,
  review_status: String,
  validation: Option<PatchValidationResult>,
  user_decision_at: Option<String>,
  applied_at: Option<String>,
  error: Option<String>,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct PatchMatchLocation {
  line: usize,
  preview: String,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct PatchValidationResult {
  id: String,
  suggestion_id: String,
  section: String,
  target_file_path: String,
  workspace_path: Option<String>,
  status: String,
  message: String,
  can_apply: bool,
  match_count: usize,
  match_locations: Vec<PatchMatchLocation>,
  original_snippet: Option<String>,
  proposed_snippet: Option<String>,
  risk: String,
  reason: String,
  testing_notes: Vec<String>,
  change_type: String,
}

#[tauri::command]
async fn create_project(app: tauri::AppHandle, project_name: Option<String>) -> CommandResult<ReduxProject> {
  let name = project_name
    .filter(|value| !value.trim().is_empty())
    .unwrap_or_else(|| "Redux AI Project".to_string());
  let root = default_projects_root(&app)?.join(sanitize_file_name(&name));
  let project_root = unique_path(root);

  create_project_dirs(&project_root)?;
  let mut project = new_project(&name, &project_root);
  save_project_file(&mut project)?;
  Ok(project)
}

#[tauri::command]
async fn open_project() -> CommandResult<Option<ReduxProject>> {
  let picked = rfd::FileDialog::new()
    .add_filter("Redux AI project", &["json"])
    .set_title("Open Redux AI project.json")
    .pick_file();

  match picked {
    Some(path) => Ok(Some(load_project_file(&path)?)),
    None => Ok(None),
  }
}

#[tauri::command]
async fn import_files(mut project: ReduxProject) -> CommandResult<ReduxProject> {
  let Some(paths) = rfd::FileDialog::new().set_title("Import files").pick_files() else {
    return Ok(project);
  };

  ensure_project_ready(&project)?;
  for source in paths {
    if source.is_file() {
      let relative = source
        .file_name()
        .map(|name| name.to_string_lossy().to_string())
        .ok_or_else(|| "Selected file has no filename.".to_string())?;
      import_one_file(&mut project, &source, &relative)?;
    }
  }
  save_project_file(&mut project)?;
  Ok(project)
}

#[tauri::command]
async fn import_folder(mut project: ReduxProject) -> CommandResult<ReduxProject> {
  let Some(folder) = rfd::FileDialog::new().set_title("Import folder").pick_folder() else {
    return Ok(project);
  };

  ensure_project_ready(&project)?;
  let folder_name = folder
    .file_name()
    .map(|name| name.to_string_lossy().to_string())
    .unwrap_or_else(|| "imported_folder".to_string());

  for entry in WalkDir::new(&folder).into_iter().filter_map(Result::ok) {
    let source = entry.path();
    if source.is_file() {
      let relative_inside = source.strip_prefix(&folder).map_err(|error| error.to_string())?;
      let relative = Path::new(&folder_name).join(relative_inside).to_string_lossy().replace('\\', "/");
      import_one_file(&mut project, source, &relative)?;
    }
  }
  save_project_file(&mut project)?;
  Ok(project)
}

#[tauri::command]
async fn scan_project(mut project: ReduxProject) -> CommandResult<ReduxProject> {
  ensure_project_ready(&project)?;
  let scan_limit = max_scan_bytes(&project);
  let line_limit = max_line_chars(&project);
  let result_limit = max_scan_results(&project);
  for file in project.files.iter_mut() {
    file.scan_matches.clear();
    if file.status != "text-readable" {
      continue;
    }
    let path = PathBuf::from(&file.workspace_path);
    let read = read_text_limited(&path, scan_limit, line_limit)?;
    let content = read.text;
    file.preview = Some(preview_text(&content));
    let mut matches = scan_content(&file.relative_path, &file.section, &content);
    matches.truncate(result_limit);
    file.scan_matches = matches;
    if let Some(warning) = read.warning {
      file.warnings.push(warning);
    }
  }
  project.updated_at = now_string();
  project.save_status = "Saved".to_string();
  save_project_file(&mut project)?;
  Ok(project)
}

#[tauri::command]
async fn save_project(mut project: ReduxProject) -> CommandResult<ReduxProject> {
  ensure_project_ready(&project)?;
  save_project_file(&mut project)?;
  Ok(project)
}

#[tauri::command]
async fn export_project(_project: ReduxProject) -> CommandResult<CommandResponse> {
  Ok(CommandResponse {
    ok: true,
    action: "export_project",
    message: "Use create_export_package for the Phase 6 export writer.".to_string(),
  })
}

#[tauri::command]
async fn build_export_preview(project: ReduxProject, export_name: String, include_reports: Option<bool>, include_all_backups: Option<bool>) -> CommandResult<serde_json::Value> {
  Ok(build_export_preview_value(&project, &export_name, include_reports.unwrap_or(true), include_all_backups.unwrap_or(false), None)?)
}

#[tauri::command]
async fn create_export_package(
  project: ReduxProject,
  export_name: String,
  include_reports: Option<bool>,
  include_all_backups: Option<bool>,
  conflict_strategy: Option<String>,
) -> CommandResult<serde_json::Value> {
  ensure_project_ready(&project)?;
  let trimmed_name = export_name.trim();
  if trimmed_name.is_empty() {
    return Err("Export name is empty.".to_string());
  }
  let root = PathBuf::from(project.project_root.clone().ok_or_else(|| "Project missing project root.".to_string())?);
  let exports_root = root.join("exports");
  fs::create_dir_all(&exports_root).map_err(|error| error.to_string())?;
  let base_export = exports_root.join(sanitize_file_name(trimmed_name));
  let export_dir = match conflict_strategy.as_deref().unwrap_or("version") {
    "overwrite" => {
      if base_export.exists() {
        fs::remove_dir_all(&base_export).map_err(|error| format!("Failed to overwrite existing export folder: {error}"))?;
      }
      base_export
    }
    "cancel" if base_export.exists() => return Err("Export folder already exists.".to_string()),
    _ => versioned_export_path(&base_export),
  };
  let preview = build_export_preview_value(&project, trimmed_name, include_reports.unwrap_or(true), include_all_backups.unwrap_or(false), Some(&export_dir))?;
  let blockers = preview.get("blockers").and_then(|value| value.as_array()).cloned().unwrap_or_default();
  if !blockers.is_empty() {
    return Ok(serde_json::json!({
      "ok": false,
      "message": "Export blocked.",
      "preview": preview,
      "validation": { "ok": false, "errors": blockers, "warnings": [] }
    }));
  }
  fs::create_dir_all(&export_dir).map_err(|error| error.to_string())?;
  fs::create_dir_all(export_dir.join("edited_files")).map_err(|error| error.to_string())?;
  fs::create_dir_all(export_dir.join("compiled_textures")).map_err(|error| error.to_string())?;
  fs::create_dir_all(export_dir.join("original_backups")).map_err(|error| error.to_string())?;
  fs::create_dir_all(export_dir.join("reports")).map_err(|error| error.to_string())?;

  let mut exported_files = Vec::new();
  for file in preview.get("includedFiles").and_then(|value| value.as_array()).cloned().unwrap_or_default() {
    let source = file.get("sourceWorkspacePath").and_then(|value| value.as_str()).unwrap_or_default();
    let output_relative = normalize_relative(file.get("outputRelativePath").and_then(|value| value.as_str()).unwrap_or_default());
    let source_path = safe_export_source_path(&project, source)?;
    let destination = safe_export_destination(&export_dir, &output_relative)?;
    if let Some(parent) = destination.parent() {
      fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    fs::copy(&source_path, &destination).map_err(|error| format!("Failed exporting {}: {error}", source_path.display()))?;
    let mut record = file.clone();
    let size = fs::metadata(&destination).map_err(|error| error.to_string())?.len();
    record["sizeBytes"] = serde_json::json!(size);
    record["outputHash"] = serde_json::json!(file_hash(&destination)?);
    record["sourceWorkspacePath"] = serde_json::json!(source_path.to_string_lossy());
    exported_files.push(record);
  }

  if include_reports.unwrap_or(true) {
    exported_files.extend(copy_project_reports(&project, &export_dir)?);
  }

  let warnings = preview.get("warnings").cloned().unwrap_or_else(|| serde_json::json!([]));
  let export_id = preview.get("exportId").and_then(|value| value.as_str()).unwrap_or("export").to_string();
  let manifest = build_manifest_value(&project, trimmed_name, &export_id, &export_dir, &exported_files, warnings.clone());
  let install_notes = build_install_notes_text(trimmed_name, &exported_files, &warnings);
  let changelog = build_export_changelog(&project, trimmed_name, &exported_files, &warnings);
  let warnings_md = build_warnings_md(&preview);
  write_json_file(&export_dir.join("manifest.json"), &manifest)?;
  fs::write(export_dir.join("install_notes.txt"), install_notes).map_err(|error| error.to_string())?;
  fs::write(export_dir.join("changelog.md"), changelog).map_err(|error| error.to_string())?;
  fs::write(export_dir.join("warnings.md"), warnings_md).map_err(|error| error.to_string())?;
  let validation = validate_export_dir(&export_dir, &manifest)?;
  let summary = serde_json::json!({
    "exportId": export_id,
    "exportName": trimmed_name,
    "exportPath": export_dir.to_string_lossy(),
    "fileCount": exported_files.len(),
    "sections": manifest["includedSections"],
    "warningsCount": warnings.as_array().map(|value| value.len()).unwrap_or(0),
    "validation": validation
  });
  write_json_file(&export_dir.join("export_summary.json"), &summary)?;
  Ok(serde_json::json!({
    "ok": validation.get("ok").and_then(|value| value.as_bool()).unwrap_or(false),
    "message": "Export package created. Manual install only; no game files or archives modified.",
    "preview": preview,
    "validation": validation,
    "exportPath": export_dir.to_string_lossy(),
    "manifestPath": export_dir.join("manifest.json").to_string_lossy(),
    "installNotesPath": export_dir.join("install_notes.txt").to_string_lossy(),
    "summaryPath": export_dir.join("export_summary.json").to_string_lossy()
  }))
}

#[tauri::command]
async fn validate_export_package(_project: ReduxProject, export_path: String) -> CommandResult<serde_json::Value> {
  let export_dir = PathBuf::from(export_path);
  let manifest_path = export_dir.join("manifest.json");
  let manifest_text = fs::read_to_string(&manifest_path).map_err(|error| error.to_string())?;
  let manifest: serde_json::Value = serde_json::from_str(&manifest_text).map_err(|error| error.to_string())?;
  Ok(validate_export_dir(&export_dir, &manifest)?)
}

#[tauri::command]
async fn open_export_folder(export_path: String) -> CommandResult<CommandResponse> {
  let path = PathBuf::from(export_path);
  if !path.exists() {
    return Err("Export folder does not exist.".to_string());
  }
  #[cfg(target_os = "windows")]
  Command::new("explorer").arg(&path).spawn().map_err(|error| error.to_string())?;
  #[cfg(target_os = "macos")]
  Command::new("open").arg(&path).spawn().map_err(|error| error.to_string())?;
  #[cfg(target_os = "linux")]
  Command::new("xdg-open").arg(&path).spawn().map_err(|error| error.to_string())?;
  Ok(CommandResponse { ok: true, action: "open_export_folder", message: "Export folder opened.".to_string() })
}

#[tauri::command]
async fn save_install_notes(project: ReduxProject, export_name: String, content: String) -> CommandResult<CommandResponse> {
  save_named_report(&project, &format!("install_notes_draft_{}.txt", sanitize_file_name(&export_name)), &content)?;
  Ok(CommandResponse { ok: true, action: "save_install_notes", message: "Install notes draft saved in reports.".to_string() })
}

#[tauri::command]
async fn save_export_manifest(project: ReduxProject, export_name: String) -> CommandResult<CommandResponse> {
  let preview = build_export_preview_value(&project, &export_name, true, false, None)?;
  let content = serde_json::to_string_pretty(preview.get("manifestPreview").unwrap_or(&preview)).map_err(|error| error.to_string())?;
  save_named_report(&project, &format!("export_manifest_preview_{}.json", sanitize_file_name(&export_name)), &content)?;
  Ok(CommandResponse { ok: true, action: "save_export_manifest", message: "Manifest preview saved in reports.".to_string() })
}

#[tauri::command]
async fn test_comfyui_connection(project: ReduxProject) -> CommandResult<serde_json::Value> {
  let url = comfyui_url(&project)?;
  let client = reqwest::Client::builder()
    .timeout(Duration::from_secs(image_ai_timeout(&project).min(30)))
    .build()
    .map_err(|error| error.to_string())?;
  let response = client.get(format!("{url}/system_stats")).send().await;
  match response {
    Ok(value) if value.status().is_success() => Ok(serde_json::json!({ "ok": true, "provider": "comfyui", "message": "ComfyUI connection OK." })),
    Ok(value) => Ok(serde_json::json!({ "ok": false, "provider": "comfyui", "message": format!("ComfyUI HTTP {}", value.status()) })),
    Err(error) => Ok(serde_json::json!({ "ok": false, "provider": "comfyui", "message": format!("ComfyUI unavailable: {error}") })),
  }
}

#[tauri::command]
async fn list_comfyui_models(project: ReduxProject) -> CommandResult<Vec<String>> {
  let url = comfyui_url(&project)?;
  let client = reqwest::Client::builder().timeout(Duration::from_secs(20)).build().map_err(|error| error.to_string())?;
  let response = client.get(format!("{url}/object_info/CheckpointLoaderSimple")).send().await.map_err(|error| error.to_string())?;
  let text = response.text().await.map_err(|error| error.to_string())?;
  let value: serde_json::Value = serde_json::from_str(&text).unwrap_or_default();
  let models = value
    .pointer("/CheckpointLoaderSimple/input/required/ckpt_name/0")
    .and_then(|item| item.as_array())
    .map(|items| items.iter().filter_map(|item| item.as_str().map(|text| text.to_string())).collect())
    .unwrap_or_default();
  Ok(models)
}

#[tauri::command]
async fn send_comfyui_image_to_image(project: ReduxProject, request: serde_json::Value) -> CommandResult<serde_json::Value> {
  ensure_project_ready(&project)?;
  let texture_id = request.get("textureId").and_then(|value| value.as_str()).ok_or_else(|| "Missing textureId.".to_string())?;
  let source = request.get("sourcePngPath").and_then(|value| value.as_str()).ok_or_else(|| "Missing source PNG path.".to_string())?;
  let source_path = safe_workspace_path_str(&project, source)?;
  if !source_path.exists() {
    return Err("Source preview PNG missing.".to_string());
  }
  let (source_width, source_height, source_alpha) = inspect_png_basic(&source_path).ok_or_else(|| "Source preview PNG cannot be inspected.".to_string())?;
  let prompt = request.get("prompt").and_then(|value| value.as_str()).unwrap_or("");
  if prompt.trim().is_empty() {
    return Err("Image edit prompt is empty.".to_string());
  }
  let negative = request.get("negativePrompt").and_then(|value| value.as_str()).unwrap_or("");
  let seed = request.get("seed").and_then(|value| value.as_i64()).unwrap_or_else(|| epoch_seconds() as i64);
  let provider = "comfyui";
  let url = comfyui_url(&project)?;
  let output_dir = image_ai_output_dir(&project)?;
  fs::create_dir_all(&output_dir).map_err(|error| error.to_string())?;
  let mut warnings = Vec::new();
  let output_id = format!("imgai-{}", epoch_millis());

  let generated = match comfyui_generate(&project, &url, &source_path, &request, &output_dir, &output_id).await {
    Ok(path) => path,
    Err(error) => {
      let metadata_path = write_image_ai_metadata(&project, &output_id, texture_id, None, &request, &[error.clone()], "failed")?;
      return Ok(serde_json::json!({
        "success": false,
        "textureId": texture_id,
        "provider": provider,
        "prompt": prompt,
        "negativePrompt": negative,
        "seed": seed,
        "settingsUsed": project.settings.get("imageAi").cloned().unwrap_or_default(),
        "metadataPath": metadata_path,
        "warnings": [error],
        "error": "ComfyUI image generation failed."
      }));
    }
  };

  if let Some((width, height, alpha)) = inspect_png_basic(&generated) {
    if width != source_width || height != source_height {
      warnings.push(format!("AI output dimensions {width}x{height} differ from source {source_width}x{source_height}."));
    }
    if source_alpha && !alpha {
      warnings.push("Source PNG had alpha but AI output appears to have no alpha.".to_string());
    }
  } else {
    warnings.push("Generated PNG cannot be inspected.".to_string());
  }
  let metadata_path = write_image_ai_metadata(&project, &output_id, texture_id, Some(&generated), &request, &warnings, "generated")?;
  Ok(serde_json::json!({
    "success": true,
    "textureId": texture_id,
    "outputPngPath": generated.to_string_lossy(),
    "provider": provider,
    "prompt": prompt,
    "negativePrompt": negative,
    "seed": seed,
    "settingsUsed": project.settings.get("imageAi").cloned().unwrap_or_default(),
    "metadataPath": metadata_path,
    "warnings": warnings,
    "output": {
      "outputId": output_id,
      "textureId": texture_id,
      "outputPath": generated.to_string_lossy(),
      "prompt": prompt,
      "negativePrompt": negative,
      "seed": seed,
      "provider": provider,
      "createdAt": now_string(),
      "settingsUsed": project.settings.get("imageAi").cloned().unwrap_or_default(),
      "warnings": warnings,
      "status": "generated",
      "metadataPath": metadata_path
    }
  }))
}

#[tauri::command]
async fn get_comfyui_job_status(job_id: String) -> CommandResult<serde_json::Value> {
  Ok(serde_json::json!({ "jobId": job_id, "status": "unknown", "progress": 0, "message": "Long-running job status is not persisted yet." }))
}

#[tauri::command]
async fn download_comfyui_output(_project: ReduxProject, output: serde_json::Value) -> CommandResult<serde_json::Value> {
  Ok(serde_json::json!({ "ok": false, "message": "Use send_comfyui_image_to_image; it downloads output automatically.", "output": output }))
}

#[tauri::command]
async fn cancel_comfyui_job(job_id: String) -> CommandResult<CommandResponse> {
  Ok(CommandResponse { ok: true, action: "cancel_comfyui_job", message: format!("Stopped tracking ComfyUI job {job_id}. ComfyUI may continue processing.") })
}

#[tauri::command]
async fn save_prompt_report(project: ReduxProject, section: String, content: String) -> CommandResult<CommandResponse> {
  save_report(&project, &section, "prompt", &content)?;
  Ok(CommandResponse {
    ok: true,
    action: "save_prompt_report",
    message: "Prompt report saved under project reports folder.".to_string(),
  })
}

#[tauri::command]
async fn save_ai_response_report(project: ReduxProject, section: String, content: String) -> CommandResult<CommandResponse> {
  save_report(&project, &section, "ai_response", &content)?;
  Ok(CommandResponse {
    ok: true,
    action: "save_ai_response_report",
    message: "AI response report saved under project reports folder.".to_string(),
  })
}

#[tauri::command]
async fn inspect_dds_metadata(project: ReduxProject, texture_id: String) -> CommandResult<TextureMetadata> {
  inspect_texture_by_id(&project, &texture_id)
}

#[tauri::command]
async fn inspect_texture_metadata(project: ReduxProject, texture_id: String) -> CommandResult<TextureMetadata> {
  inspect_texture_by_id(&project, &texture_id)
}

#[tauri::command]
async fn check_texture_tools(project: ReduxProject) -> CommandResult<TextureToolCheck> {
  let converter_path = texture_converter_path(&project);
  if converter_path.trim().is_empty() {
    return Ok(TextureToolCheck {
      ok: false,
      converter_path,
      exists: false,
      can_run: false,
      version_output: None,
      warning: Some("No texture converter path configured. Set texconv in Settings.".to_string()),
    });
  }
  let exists = Path::new(&converter_path).exists();
  let output = if exists {
    Command::new(&converter_path).arg("-?").output().ok()
  } else {
    None
  };
  let can_run = output.is_some();
  let version_output = output.map(|value| {
    let mut text = String::from_utf8_lossy(&value.stdout).to_string();
    if text.trim().is_empty() {
      text = String::from_utf8_lossy(&value.stderr).to_string();
    }
    text.chars().take(800).collect()
  });
  Ok(TextureToolCheck {
    ok: exists && can_run,
    converter_path,
    exists,
    can_run,
    version_output,
    warning: if exists && can_run { None } else { Some("Converter path does not exist or cannot run.".to_string()) },
  })
}

#[tauri::command]
async fn convert_dds_to_png(project: ReduxProject, texture_id: String) -> CommandResult<TextureConversionResult> {
  ensure_project_ready(&project)?;
  let texture = texture_by_id(&project, &texture_id)?;
  let source = safe_workspace_path_str(&project, texture.get("workspacePath").and_then(|v| v.as_str()).unwrap_or_default())?;
  let metadata = inspect_texture_path(&source)?;
  let preview_dir = texture_cache_dir(&project, "texture-previews")?;
  fs::create_dir_all(&preview_dir).map_err(|error| error.to_string())?;
  let converter = texture_converter_path(&project);
  if converter.trim().is_empty() || !Path::new(&converter).exists() {
    return Ok(TextureConversionResult {
      success: false,
      texture_id,
      source_path: source.to_string_lossy().to_string(),
      output_path: None,
      metadata: Some(metadata),
      warnings: vec!["Real DDS to PNG conversion requires a configured texconv path.".to_string()],
      command_output: None,
      error: Some("Converter path missing or invalid.".to_string()),
    });
  }
  let output = Command::new(&converter)
    .args(["-ft", "PNG", "-y", "-o"])
    .arg(&preview_dir)
    .arg(&source)
    .output()
    .map_err(|error| error.to_string())?;
  let command_text = command_output_text(&output);
  let expected = preview_dir.join(source.file_stem().unwrap_or_default()).with_extension("png");
  let success = output.status.success() && expected.exists();
  Ok(TextureConversionResult {
    success,
    texture_id,
    source_path: source.to_string_lossy().to_string(),
    output_path: success.then(|| expected.to_string_lossy().to_string()),
    metadata: Some(metadata),
    warnings: if success { Vec::new() } else { vec!["DDS preview output was not created.".to_string()] },
    command_output: Some(command_text),
    error: if success { None } else { Some("DDS to PNG conversion failed.".to_string()) },
  })
}

#[tauri::command]
async fn import_edited_texture_png(project: ReduxProject, texture_id: String) -> CommandResult<TextureConversionResult> {
  ensure_project_ready(&project)?;
  let texture = texture_by_id(&project, &texture_id)?;
  let Some(picked) = rfd::FileDialog::new().add_filter("PNG image", &["png"]).set_title("Import edited texture PNG").pick_file() else {
    return Ok(TextureConversionResult {
      success: false,
      texture_id,
      source_path: String::new(),
      output_path: None,
      metadata: None,
      warnings: Vec::new(),
      command_output: None,
      error: Some("No edited PNG selected.".to_string()),
    });
  };
  let edit_dir = texture_cache_dir(&project, "texture-edits")?;
  fs::create_dir_all(&edit_dir).map_err(|error| error.to_string())?;
  let file_stem = texture.get("fileName").and_then(|v| v.as_str()).unwrap_or("texture.dds").trim_end_matches(".dds");
  let destination = unique_path(edit_dir.join(format!("{file_stem}_edited.png")));
  fs::copy(&picked, &destination).map_err(|error| error.to_string())?;
  let mut warnings = Vec::new();
  let original = texture.get("metadata").and_then(|value| serde_json::from_value::<TextureMetadata>(value.clone()).ok());
  if let Some((width, height, alpha)) = inspect_png_basic(&destination) {
    if let Some(meta) = original.as_ref() {
      if meta.width != Some(width) || meta.height != Some(height) {
        warnings.push(format!("Edited PNG dimensions are {width}x{height}; original DDS is {}x{}.", meta.width.unwrap_or(0), meta.height.unwrap_or(0)));
      }
      if meta.has_alpha.as_deref() == Some("yes") && !alpha {
        warnings.push("Original DDS appears to have alpha but edited PNG has no alpha channel.".to_string());
      }
    }
  } else {
    warnings.push("Edited PNG dimensions/alpha could not be inspected.".to_string());
  }
  Ok(TextureConversionResult {
    success: true,
    texture_id,
    source_path: picked.to_string_lossy().to_string(),
    output_path: Some(destination.to_string_lossy().to_string()),
    metadata: original,
    warnings,
    command_output: None,
    error: None,
  })
}

#[tauri::command]
async fn convert_png_to_dds(project: ReduxProject, texture_id: String, allow_dimension_mismatch: Option<bool>) -> CommandResult<TextureConversionResult> {
  ensure_project_ready(&project)?;
  let texture = texture_by_id(&project, &texture_id)?;
  let edited = texture
    .get("editedPngPath")
    .and_then(|value| value.as_str())
    .filter(|value| !value.trim().is_empty())
    .ok_or_else(|| "No edited PNG is attached to this texture.".to_string())?;
  let edited_path = safe_workspace_path_str(&project, edited)?;
  if !edited_path.exists() {
    return Err("Edited PNG is missing from workspace.".to_string());
  }
  let original_meta = texture.get("metadata").and_then(|value| serde_json::from_value::<TextureMetadata>(value.clone()).ok());
  let mut warnings = Vec::new();
  if let Some((width, height, alpha)) = inspect_png_basic(&edited_path) {
    if let Some(meta) = original_meta.as_ref() {
      let mismatch = meta.width != Some(width) || meta.height != Some(height);
      if mismatch {
        warnings.push(format!("PNG dimensions {width}x{height} differ from original DDS {}x{}.", meta.width.unwrap_or(0), meta.height.unwrap_or(0)));
        if !allow_dimension_mismatch.unwrap_or(false) {
          return Ok(TextureConversionResult {
            success: false,
            texture_id,
            source_path: edited_path.to_string_lossy().to_string(),
            output_path: None,
            metadata: original_meta,
            warnings,
            command_output: None,
            error: Some("Dimension mismatch requires explicit confirmation.".to_string()),
          });
        }
      }
      if meta.has_alpha.as_deref() == Some("yes") && !alpha {
        warnings.push("Original DDS had alpha but edited PNG appears to have no alpha.".to_string());
      }
    }
  } else {
    warnings.push("Edited PNG metadata could not be inspected before DDS compile.".to_string());
  }
  let converter = texture_converter_path(&project);
  if converter.trim().is_empty() || !Path::new(&converter).exists() {
    return Ok(TextureConversionResult {
      success: false,
      texture_id,
      source_path: edited_path.to_string_lossy().to_string(),
      output_path: None,
      metadata: original_meta,
      warnings: [warnings, vec!["Real PNG to DDS conversion requires a configured texconv path.".to_string()]].concat(),
      command_output: None,
      error: Some("Converter path missing or invalid.".to_string()),
    });
  }
  let compiled_dir = texture_cache_dir(&project, "texture-compiled")?;
  fs::create_dir_all(&compiled_dir).map_err(|error| error.to_string())?;
  let original_name = texture.get("fileName").and_then(|value| value.as_str()).unwrap_or("texture.dds");
  let output_path = unique_path(compiled_dir.join(original_name));
  let out_dir = output_path.parent().ok_or_else(|| "Compiled output has no parent folder.".to_string())?;
  let format = texture_output_format(&project, original_meta.as_ref());
  let generate_mipmaps = texture_bool_setting(&project, "generateMipmaps", true);
  if texture_bool_setting(&project, "preserveOriginalFormat", true) && original_meta.as_ref().and_then(|meta| meta.format.as_ref()).is_none() {
    warnings.push("Original DDS format metadata cannot be preserved; falling back to configured default DDS format.".to_string());
  }
  if original_meta.as_ref().and_then(|meta| meta.mipmap_count).unwrap_or(1) > 1 && !generate_mipmaps {
    warnings.push("Original DDS had mipmaps but mipmap generation is disabled.".to_string());
  }
  let mip_arg = if generate_mipmaps { "0" } else { "1" };
  let output = Command::new(&converter)
    .args(["-y", "-f", &format, "-m", mip_arg, "-o"])
    .arg(out_dir)
    .arg(&edited_path)
    .output()
    .map_err(|error| error.to_string())?;
  let command_text = command_output_text(&output);
  let produced = out_dir.join(edited_path.file_stem().unwrap_or_default()).with_extension("dds");
  let success = output.status.success() && produced.exists();
  if success && produced != output_path {
    fs::rename(&produced, &output_path).map_err(|error| error.to_string())?;
  }
  let compiled_meta = if success { inspect_texture_path(&output_path).ok().or(original_meta) } else { original_meta };
  Ok(TextureConversionResult {
    success,
    texture_id,
    source_path: edited_path.to_string_lossy().to_string(),
    output_path: success.then(|| output_path.to_string_lossy().to_string()),
    metadata: compiled_meta,
    warnings,
    command_output: Some(command_text),
    error: if success { None } else { Some("PNG to DDS conversion failed.".to_string()) },
  })
}

#[tauri::command]
async fn save_texture_report(project: ReduxProject, notes: Option<String>) -> CommandResult<CommandResponse> {
  let content = build_texture_report(&project, notes.unwrap_or_default());
  save_named_report(&project, &format!("texture_report_{}.md", epoch_seconds()), &content)?;
  Ok(CommandResponse {
    ok: true,
    action: "save_texture_report",
    message: "Texture report saved under project reports folder.".to_string(),
  })
}

#[tauri::command]
async fn send_openrouter_chat_request(request: OpenRouterRequest) -> CommandResult<OpenRouterResponse> {
  if request.api_key.trim().is_empty() {
    return Ok(OpenRouterResponse {
      ok: false,
      raw_response_text: String::new(),
      assistant_content: String::new(),
      model_used: request.model,
      request_ms: 0,
      error: Some("Missing OpenRouter API key.".to_string()),
      status_code: None,
    });
  }

  let started = Instant::now();
  let timeout_seconds = request.timeout_seconds.clamp(5, 300);
  let client = reqwest::Client::builder()
    .timeout(Duration::from_secs(timeout_seconds))
    .build()
    .map_err(|error| error.to_string())?;

  let mut builder = client
    .post(&request.base_url)
    .bearer_auth(request.api_key.trim())
    .header("Content-Type", "application/json");

  if let Some(site_url) = request.site_url.as_ref().filter(|value| !value.trim().is_empty()) {
    builder = builder.header("HTTP-Referer", site_url.trim());
  }
  if let Some(app_name) = request.app_name.as_ref().filter(|value| !value.trim().is_empty()) {
    builder = builder.header("X-Title", app_name.trim()).header("X-OpenRouter-Title", app_name.trim());
  }

  let payload = serde_json::json!({
    "model": request.model,
    "messages": request.messages,
    "temperature": request.temperature,
    "max_tokens": request.max_tokens
  });

  let model_used = payload["model"].as_str().unwrap_or_default().to_string();
  let response = match builder.json(&payload).send().await {
    Ok(value) => value,
    Err(error) => {
      let message = if error.is_timeout() {
        "OpenRouter request timed out.".to_string()
      } else {
        format!("OpenRouter network/API error: {error}")
      };
      return Ok(OpenRouterResponse {
        ok: false,
        raw_response_text: String::new(),
        assistant_content: String::new(),
        model_used,
        request_ms: started.elapsed().as_millis(),
        error: Some(message),
        status_code: None,
      });
    }
  };

  let status = response.status();
  let status_code = status.as_u16();
  let raw_response_text = response.text().await.unwrap_or_default();
  if !status.is_success() {
    return Ok(OpenRouterResponse {
      ok: false,
      assistant_content: String::new(),
      model_used,
      request_ms: started.elapsed().as_millis(),
      error: Some(openrouter_status_error(status_code, &raw_response_text)),
      raw_response_text,
      status_code: Some(status_code),
    });
  }

  let assistant_content = extract_assistant_content(&raw_response_text);
  let empty = assistant_content.trim().is_empty();
  Ok(OpenRouterResponse {
    ok: !empty,
    error: if empty { Some("OpenRouter returned an empty assistant response.".to_string()) } else { None },
    raw_response_text,
    assistant_content,
    model_used,
    request_ms: started.elapsed().as_millis(),
    status_code: Some(status_code),
  })
}

#[tauri::command]
async fn read_workspace_file(project: ReduxProject, relative_path: String) -> CommandResult<String> {
  let file = project
    .files
    .iter()
    .find(|file| file.relative_path == relative_path)
    .ok_or_else(|| "Target file is not imported in this project.".to_string())?;
  let path = safe_workspace_file_path(&project, file)?;
  fs::read_to_string(path).map_err(|error| error.to_string())
}

#[tauri::command]
async fn reveal_in_file_manager(path: String) -> CommandResult<CommandResponse> {
  let target = PathBuf::from(path);
  let reveal = if target.is_file() { target.parent().map(|p| p.to_path_buf()).unwrap_or(target) } else { target };
  if !reveal.exists() {
    return Err("Path does not exist.".to_string());
  }
  #[cfg(target_os = "windows")]
  Command::new("explorer").arg(&reveal).spawn().map_err(|error| error.to_string())?;
  #[cfg(target_os = "macos")]
  Command::new("open").arg(&reveal).spawn().map_err(|error| error.to_string())?;
  #[cfg(target_os = "linux")]
  Command::new("xdg-open").arg(&reveal).spawn().map_err(|error| error.to_string())?;
  Ok(CommandResponse { ok: true, action: "reveal_in_file_manager", message: "Path revealed.".to_string() })
}

#[tauri::command]
async fn write_workspace_file(project: ReduxProject, relative_path: String, content: String) -> CommandResult<CommandResponse> {
  let file = project
    .files
    .iter()
    .find(|file| file.relative_path == relative_path)
    .ok_or_else(|| "Target file is not imported in this project.".to_string())?;
  let path = safe_workspace_file_path(&project, file)?;
  if file.status != "text-readable" {
    return Err("Only text-readable workspace files can be written.".to_string());
  }
  validate_syntax_for_extension(&file.extension, &content)?;
  atomic_write(&path, &content)?;
  Ok(CommandResponse {
    ok: true,
    action: "write_workspace_file",
    message: "Workspace file written. Original source file untouched.".to_string(),
  })
}

#[tauri::command]
async fn create_workspace_backup(project: ReduxProject, relative_path: String, patch_id: String) -> CommandResult<CommandResponse> {
  let file = project
    .files
    .iter()
    .find(|file| file.relative_path == relative_path)
    .ok_or_else(|| "Target file is not imported in this project.".to_string())?;
  let batch_id = format!("manual_backup_{}", epoch_seconds());
  let backup_path = backup_workspace_file(&project, file, &batch_id, &patch_id)?;
  Ok(CommandResponse {
    ok: true,
    action: "create_workspace_backup",
    message: format!("Backup created at {}.", backup_path.to_string_lossy()),
  })
}

#[tauri::command]
async fn validate_patch(project: ReduxProject, review: PatchReviewState) -> CommandResult<PatchValidationResult> {
  Ok(validate_one_patch(&project, &review))
}

#[tauri::command]
async fn validate_patches(project: ReduxProject, reviews: Vec<PatchReviewState>) -> CommandResult<Vec<PatchValidationResult>> {
  Ok(reviews.iter().map(|review| validate_one_patch(&project, review)).collect())
}

#[tauri::command]
async fn apply_patch_to_workspace(mut project: ReduxProject, review: PatchReviewState) -> CommandResult<ReduxProject> {
  project = apply_reviews_to_workspace(project, vec![review])?;
  Ok(project)
}

#[tauri::command]
async fn apply_accepted_patches(mut project: ReduxProject, reviews: Vec<PatchReviewState>) -> CommandResult<ReduxProject> {
  project = apply_reviews_to_workspace(project, reviews)?;
  Ok(project)
}

fn default_projects_root(app: &tauri::AppHandle) -> CommandResult<PathBuf> {
  let base = app
    .path()
    .document_dir()
    .or_else(|_| app.path().app_data_dir())
    .map_err(|error| error.to_string())?;
  Ok(base.join("ReduxAIProjects"))
}

fn create_project_dirs(project_root: &Path) -> CommandResult<()> {
  fs::create_dir_all(project_root.join("workspace")).map_err(|error| error.to_string())?;
  fs::create_dir_all(project_root.join("backups")).map_err(|error| error.to_string())?;
  fs::create_dir_all(project_root.join("reports")).map_err(|error| error.to_string())?;
  fs::create_dir_all(project_root.join("exports")).map_err(|error| error.to_string())?;
  Ok(())
}

fn new_project(project_name: &str, project_root: &Path) -> ReduxProject {
  let project_json = project_root.join("project.json");
  let workspace = project_root.join("workspace");
  ReduxProject {
    version: APP_VERSION.to_string(),
    project_id: format!("project-{}", epoch_seconds()),
    project_name: project_name.to_string(),
    created_at: now_string(),
    updated_at: now_string(),
    save_status: "Saved".to_string(),
    notes: "Local project. Original source files are never modified.".to_string(),
    project_root: Some(project_root.to_string_lossy().to_string()),
    project_json_path: Some(project_json.to_string_lossy().to_string()),
    workspace_path: Some(workspace.to_string_lossy().to_string()),
    sections: default_sections(),
    files: Vec::new(),
    ai_history: Vec::new(),
    ai_suggestions: Vec::new(),
    patch_reviews: Vec::new(),
    applied_patches: Vec::new(),
    backups: Vec::new(),
    changelog_entries: Vec::new(),
    patch_batches: Vec::new(),
    ai_responses: Vec::new(),
    patches: Vec::new(),
    textures: Vec::new(),
    export_history: Vec::new(),
    image_generation_history: Vec::new(),
    prompt_basket: Vec::new(),
    diagnostics: Vec::new(),
    last_indexed_at: Some(now_string()),
    scan_cache: serde_json::json!({}),
    operation_history: Vec::new(),
    settings: serde_json::json!({
      "aiProvider": "OpenRouter-compatible",
      "apiKey": "",
      "model": "openai/gpt-oss-120b:free",
      "openRouterBaseUrl": "https://openrouter.ai/api/v1/chat/completions",
      "openRouterSiteUrl": "http://localhost",
      "openRouterAppName": "Redux AI Assistant",
      "maxTokens": 1800,
      "temperature": 0.2,
      "timeoutSeconds": 60,
      "exportDirectory": project_root.join("exports").to_string_lossy(),
      "projectStorage": project_json.to_string_lossy(),
      "converterPaths": {
        "ddsToImage": "",
        "imageToDds": "",
        "metadataInspector": ""
      },
      "textureTools": {
        "converterPath": "",
        "defaultDdsFormat": "BC7_UNORM",
        "generateMipmaps": true,
        "preserveOriginalFormat": true,
        "preserveAlpha": true,
        "backupBeforeReplace": true,
        "previewFolder": ".redux-ai/texture-previews"
      },
      "imageAi": {
        "provider": "manual",
        "comfyuiUrl": "http://127.0.0.1:8188",
        "workflowPreset": "img2img_basic",
        "outputFolder": ".redux-ai/image-ai",
        "seedMode": "random",
        "fixedSeed": 123456,
        "steps": 24,
        "cfg": 6.0,
        "denoise": 0.45,
        "sampler": "euler",
        "checkpoint": "",
        "timeoutSeconds": 180,
        "saveRawWorkflowJson": true,
        "saveGenerationMetadata": true
      },
      "safety": {
        "createBackups": true,
        "validatePatchTargets": true,
        "blockBinaryPatches": true,
        "requireManifest": true,
        "warnTextureMetadata": true
      },
      "experimental": {
        "imageWorkflow": false,
        "batchTextures": false
      },
      "logging": {
        "debugLogging": false,
        "retentionLimit": 250
      },
      "limits": {
        "maxPreviewBytes": 262144,
        "maxScanBytes": 2097152,
        "maxLinePreviewChars": 240,
        "maxScanResults": 500,
        "maxPromptChars": 12000
      }
    }),
  }
}

fn default_sections() -> HashMap<String, ProjectSection> {
  [
    ("dashboard", "Dashboard", "Project overview, progress, warnings, and next actions."),
    ("timecycle", "Timecycle", "Weather, lighting, atmosphere, exposure, fog, sky, clouds, and visual feel."),
    ("tracers", "Tracers", "Bullet trails, muzzle glow, particle lifetime, alpha, and weapon visual effects."),
    ("hitEffects", "Hit Effects", "Bullet impacts, sparks, dust, blood effects, decals, and short feedback."),
    ("killEffect", "Kill Effect", "Script or overlay concepts only when supported by a safe scriptable setup."),
    ("optimization", "Optimization", "Risk-ranked scans for clutter and performance-heavy visual assets."),
    ("textures", "Textures", "DDS -> PNG preview -> AI/manual edit -> DDS export workflow."),
    ("intelligence", "Intelligence", "Global search, indexing, prompt basket, relationships, diagnostics, and project health."),
    ("export", "Export", "Review accepted changes and create a safe output folder with backups and manifest."),
    ("settings", "Settings", "AI provider, model, export folder, converter paths, and safety controls."),
  ]
  .into_iter()
  .map(|(id, name, description)| {
    (
      id.to_string(),
      ProjectSection {
        id: id.to_string(),
        name: name.to_string(),
        description: description.to_string(),
        goal: String::new(),
        warnings: Vec::new(),
      },
    )
  })
  .collect()
}

fn import_one_file(project: &mut ReduxProject, source: &Path, relative_path: &str) -> CommandResult<()> {
  let workspace = PathBuf::from(project.workspace_path.clone().ok_or_else(|| "Project missing workspace path.".to_string())?);
  let safe_relative = normalize_relative(relative_path);
  let destination = workspace.join(Path::new(&safe_relative));
  if let Some(parent) = destination.parent() {
    fs::create_dir_all(parent).map_err(|error| error.to_string())?;
  }
  fs::copy(source, &destination).map_err(|error| format!("Failed copying {}: {error}", source.display()))?;

  let metadata = fs::metadata(&destination).map_err(|error| error.to_string())?;
  let file_name = source
    .file_name()
    .map(|name| name.to_string_lossy().to_string())
    .unwrap_or_else(|| "unknown".to_string());
  let extension = source
    .extension()
    .map(|ext| format!(".{}", ext.to_string_lossy().to_ascii_lowercase()))
    .unwrap_or_default();
  let status = detect_status(&extension);
  let section = classify_section(&safe_relative, &extension);
  let mut warnings = detect_warnings(&extension, &status);
  if project.files.iter().any(|file| file.relative_path == safe_relative) {
    project.files.retain(|file| file.relative_path != safe_relative);
    warnings.push("Re-import replaced previous workspace copy metadata.".to_string());
  }
  let preview = if status == "text-readable" {
    read_text_limited(&destination, 262_144, 240).ok().map(|content| preview_text(&content.text))
  } else {
    None
  };

  project.files.push(ProjectFile {
    id: format!("file-{}", epoch_millis()),
    source_path: source.to_string_lossy().to_string(),
    workspace_path: destination.to_string_lossy().to_string(),
    relative_path: safe_relative.clone(),
    file_name: file_name.clone(),
    extension: extension.clone(),
    size_bytes: metadata.len(),
    status,
    section,
    warnings: warnings.clone(),
    scan_matches: Vec::new(),
    preview,
  });
  if is_texture_extension(&extension) {
    upsert_texture_asset(project, source, &destination, &safe_relative, &file_name, &extension, metadata.len(), &warnings);
  }
  project.updated_at = now_string();
  project.save_status = "Saved".to_string();
  Ok(())
}

fn detect_status(extension: &str) -> String {
  match extension {
    ".xml" | ".dat" | ".meta" | ".ini" | ".txt" | ".json" | ".cfg" => "text-readable",
    ".dds" | ".png" | ".tga" | ".jpg" | ".jpeg" | ".webp" => "texture-workflow",
    ".rpf" | ".ytd" | ".ypt" | ".ydr" | ".ydd" | ".awc" => "binary-unsupported",
    _ => "unsupported",
  }
  .to_string()
}

fn classify_section(relative_path: &str, extension: &str) -> String {
  let text = relative_path.to_ascii_lowercase();
  if is_texture_extension(extension) || contains_any(&text, &["texture", ".ytd", "diffuse", "normal", "spec", "alpha", "mipmap", "road"]) {
    return "textures".to_string();
  }
  if contains_any(&text, &["script", "kill", "overlay", "nui"]) {
    return "killEffect".to_string();
  }
  if contains_any(&text, &["blood", "decal", "impact", "spark", "particle", "wound"]) {
    return "hitEffects".to_string();
  }
  if contains_any(&text, &["tracer", "bullet", "weapon", "muzzle", "core.ypt", "projectile", "beam"]) {
    return "tracers".to_string();
  }
  if contains_any(&text, &["timecycle", "weather", "visualsettings", "cloud", "fog", "bloom", "exposure"]) {
    return "timecycle".to_string();
  }
  if contains_any(&text, &["grass", "veg", "bush", "tree", "trash", "debris", "lod", "density", "rubbish", "garbage"]) {
    return "optimization".to_string();
  }
  "dashboard".to_string()
}

fn detect_warnings(extension: &str, status: &str) -> Vec<String> {
  let mut warnings = Vec::new();
  if status == "texture-workflow" {
    warnings.push(format!("{extension} is tracked by the texture workflow. Original source file will not be modified."));
  } else if status == "binary-unsupported" {
    warnings.push(format!("{extension} is binary/unsupported in Phase 2. File is copied but not read or edited."));
  } else if status == "unsupported" {
    warnings.push(format!("{extension} is not supported yet. File is copied for tracking only."));
  }
  warnings
}

fn is_texture_extension(extension: &str) -> bool {
  matches!(extension, ".dds" | ".png" | ".tga" | ".jpg" | ".jpeg" | ".webp")
}

fn upsert_texture_asset(project: &mut ReduxProject, source: &Path, destination: &Path, relative_path: &str, file_name: &str, extension: &str, size: u64, file_warnings: &[String]) {
  if extension != ".dds" {
    return;
  }
  let role = guess_texture_role(relative_path);
  let mut metadata = inspect_texture_path(destination).unwrap_or(TextureMetadata {
    file_path: destination.to_string_lossy().to_string(),
    filename: file_name.to_string(),
    width: None,
    height: None,
    format: None,
    mipmap_count: None,
    has_alpha: Some("unknown".to_string()),
    file_size_bytes: size,
    role_guess: role.clone(),
    warnings: texture_role_warnings(&role),
  });
  metadata.warnings = texture_metadata_warnings(&metadata);
  let warnings = unique_strings([file_warnings.to_vec(), texture_role_warnings(&role), metadata.warnings.clone()].concat());
  project.textures.retain(|value| value.get("relativePath").and_then(|v| v.as_str()) != Some(relative_path));
  project.textures.push(serde_json::json!({
    "textureId": format!("texture-{}", epoch_millis()),
    "section": "textures",
    "originalPath": source.to_string_lossy(),
    "workspacePath": destination.to_string_lossy(),
    "relativePath": relative_path,
    "fileName": file_name,
    "metadata": metadata,
    "roleGuess": role,
    "warnings": warnings,
    "conversionStatus": "metadata_ready",
    "exportReady": false,
    "notes": "Imported DDS copied into the project workspace. Original source file untouched."
  }));
}

fn texture_by_id(project: &ReduxProject, texture_id: &str) -> CommandResult<serde_json::Value> {
  project
    .textures
    .iter()
    .find(|value| value.get("textureId").and_then(|v| v.as_str()) == Some(texture_id))
    .cloned()
    .ok_or_else(|| "Texture record not found in project.json.".to_string())
}

fn inspect_texture_by_id(project: &ReduxProject, texture_id: &str) -> CommandResult<TextureMetadata> {
  let texture = texture_by_id(project, texture_id)?;
  let path = texture
    .get("workspacePath")
    .and_then(|value| value.as_str())
    .ok_or_else(|| "Texture has no workspace path.".to_string())?;
  let path = safe_workspace_path_str(project, path)?;
  inspect_texture_path(&path)
}

fn inspect_texture_path(path: &Path) -> CommandResult<TextureMetadata> {
  let file_size_bytes = fs::metadata(path).map_err(|error| error.to_string())?.len();
  let filename = path.file_name().map(|v| v.to_string_lossy().to_string()).unwrap_or_else(|| "texture".to_string());
  let role_guess = guess_texture_role(&path.to_string_lossy());
  let mut metadata = if path.extension().map(|v| v.to_string_lossy().to_ascii_lowercase()) == Some("dds".to_string()) {
    inspect_dds_basic(path, &filename, file_size_bytes, &role_guess)?
  } else if path.extension().map(|v| v.to_string_lossy().to_ascii_lowercase()) == Some("png".to_string()) {
    let (width, height, alpha) = inspect_png_basic(path).unwrap_or((0, 0, false));
    TextureMetadata {
      file_path: path.to_string_lossy().to_string(),
      filename,
      width: (width > 0).then_some(width),
      height: (height > 0).then_some(height),
      format: Some(if alpha { "PNG RGBA".to_string() } else { "PNG RGB".to_string() }),
      mipmap_count: Some(1),
      has_alpha: Some(if alpha { "yes".to_string() } else { "no".to_string() }),
      file_size_bytes,
      role_guess,
      warnings: Vec::new(),
    }
  } else {
    TextureMetadata {
      file_path: path.to_string_lossy().to_string(),
      filename,
      width: None,
      height: None,
      format: None,
      mipmap_count: None,
      has_alpha: Some("unknown".to_string()),
      file_size_bytes,
      role_guess,
      warnings: vec!["Unsupported texture metadata format.".to_string()],
    }
  };
  metadata.warnings = texture_metadata_warnings(&metadata);
  Ok(metadata)
}

fn inspect_dds_basic(path: &Path, filename: &str, file_size_bytes: u64, role_guess: &str) -> CommandResult<TextureMetadata> {
  let bytes = fs::read(path).map_err(|error| error.to_string())?;
  if bytes.len() < 128 || &bytes[0..4] != b"DDS " {
    return Err("Corrupt DDS or unsupported DDS header.".to_string());
  }
  let height = read_u32_le(&bytes, 12);
  let width = read_u32_le(&bytes, 16);
  let mipmap_count = read_u32_le(&bytes, 28);
  let fourcc = String::from_utf8_lossy(&bytes[84..88]).trim_matches(char::from(0)).to_string();
  let rgb_bits = read_u32_le(&bytes, 88);
  let caps_alpha = read_u32_le(&bytes, 80) & 0x1 != 0;
  let format = if fourcc.is_empty() {
    if rgb_bits > 0 { format!("Uncompressed {rgb_bits}-bit") } else { "DDS unknown".to_string() }
  } else {
    fourcc
  };
  Ok(TextureMetadata {
    file_path: path.to_string_lossy().to_string(),
    filename: filename.to_string(),
    width: (width > 0).then_some(width),
    height: (height > 0).then_some(height),
    format: Some(format),
    mipmap_count: Some(if mipmap_count == 0 { 1 } else { mipmap_count }),
    has_alpha: Some(if caps_alpha || rgb_bits == 32 { "yes".to_string() } else { "unknown".to_string() }),
    file_size_bytes,
    role_guess: role_guess.to_string(),
    warnings: texture_role_warnings(role_guess),
  })
}

fn inspect_png_basic(path: &Path) -> Option<(u32, u32, bool)> {
  let bytes = fs::read(path).ok()?;
  if bytes.len() < 33 || &bytes[0..8] != b"\x89PNG\r\n\x1a\n" {
    return None;
  }
  let width = u32::from_be_bytes(bytes[16..20].try_into().ok()?);
  let height = u32::from_be_bytes(bytes[20..24].try_into().ok()?);
  let color_type = bytes[25];
  Some((width, height, matches!(color_type, 4 | 6)))
}

fn comfyui_url(project: &ReduxProject) -> CommandResult<String> {
  let url = project
    .settings
    .get("imageAi")
    .and_then(|value| value.get("comfyuiUrl"))
    .and_then(|value| value.as_str())
    .unwrap_or("http://127.0.0.1:8188")
    .trim()
    .trim_end_matches('/')
    .to_string();
  if !url.starts_with("http://") && !url.starts_with("https://") {
    return Err("Invalid ComfyUI URL. Use http://host:port.".to_string());
  }
  Ok(url)
}

fn image_ai_timeout(project: &ReduxProject) -> u64 {
  project
    .settings
    .get("imageAi")
    .and_then(|value| value.get("timeoutSeconds"))
    .and_then(|value| value.as_u64())
    .unwrap_or(180)
}

fn image_ai_output_dir(project: &ReduxProject) -> CommandResult<PathBuf> {
  let workspace = PathBuf::from(project.workspace_path.clone().ok_or_else(|| "Project missing workspace path.".to_string())?);
  let folder = project
    .settings
    .get("imageAi")
    .and_then(|value| value.get("outputFolder"))
    .and_then(|value| value.as_str())
    .unwrap_or(".redux-ai/image-ai");
  Ok(workspace.join(normalize_relative(folder)))
}

async fn comfyui_generate(project: &ReduxProject, url: &str, source_path: &Path, request: &serde_json::Value, output_dir: &Path, output_id: &str) -> CommandResult<PathBuf> {
  let client = reqwest::Client::builder()
    .timeout(Duration::from_secs(image_ai_timeout(project)))
    .build()
    .map_err(|error| error.to_string())?;
  let image_name = format!("{output_id}_source.png");
  let bytes = fs::read(source_path).map_err(|error| error.to_string())?;
  let part = reqwest::multipart::Part::bytes(bytes).file_name(image_name.clone()).mime_str("image/png").map_err(|error| error.to_string())?;
  let form = reqwest::multipart::Form::new().part("image", part).text("type", "input");
  let upload = client.post(format!("{url}/upload/image")).multipart(form).send().await.map_err(|error| format!("Image upload failed: {error}"))?;
  if !upload.status().is_success() {
    return Err(format!("Image upload failed: HTTP {}", upload.status()));
  }
  let workflow = build_comfyui_workflow(project, request, &image_name);
  if project.settings.get("imageAi").and_then(|v| v.get("saveRawWorkflowJson")).and_then(|v| v.as_bool()).unwrap_or(true) {
    write_json_file(&output_dir.join(format!("{output_id}_workflow.json")), &workflow)?;
  }
  let prompt_response = client.post(format!("{url}/prompt")).json(&serde_json::json!({ "prompt": workflow })).send().await.map_err(|error| format!("Workflow submit failed: {error}"))?;
  let prompt_text = prompt_response.text().await.map_err(|error| error.to_string())?;
  let prompt_value: serde_json::Value = serde_json::from_str(&prompt_text).map_err(|_| format!("Invalid ComfyUI prompt response: {prompt_text}"))?;
  let prompt_id = prompt_value.get("prompt_id").and_then(|value| value.as_str()).ok_or_else(|| format!("ComfyUI did not return prompt_id: {prompt_text}"))?;
  let started = Instant::now();
  let timeout = Duration::from_secs(image_ai_timeout(project));
  loop {
    if started.elapsed() > timeout {
      return Err("ComfyUI generation timed out.".to_string());
    }
    std::thread::sleep(Duration::from_millis(900));
    let history_response = client.get(format!("{url}/history/{prompt_id}")).send().await.map_err(|error| format!("History poll failed: {error}"))?;
    let history_text = history_response.text().await.map_err(|error| error.to_string())?;
    let history: serde_json::Value = serde_json::from_str(&history_text).unwrap_or_default();
    let Some(entry) = history.get(prompt_id) else {
      continue;
    };
    if let Some(outputs) = entry.get("outputs").and_then(|value| value.as_object()) {
      for output in outputs.values() {
        if let Some(images) = output.get("images").and_then(|value| value.as_array()) {
          if let Some(image) = images.first() {
            let filename = image.get("filename").and_then(|value| value.as_str()).ok_or_else(|| "ComfyUI output missing filename.".to_string())?;
            let subfolder = image.get("subfolder").and_then(|value| value.as_str()).unwrap_or("");
            let image_type = image.get("type").and_then(|value| value.as_str()).unwrap_or("output");
            let view_url = format!("{url}/view?filename={}&subfolder={}&type={}", url_escape(filename), url_escape(subfolder), url_escape(image_type));
            let image_bytes = client.get(view_url).send().await.map_err(|error| format!("Output download failed: {error}"))?.bytes().await.map_err(|error| error.to_string())?;
            let destination = output_dir.join(format!("{output_id}.png"));
            fs::write(&destination, image_bytes).map_err(|error| error.to_string())?;
            return Ok(destination);
          }
        }
      }
    }
    if entry.get("status").and_then(|s| s.get("status_str")).and_then(|value| value.as_str()) == Some("error") {
      return Err("ComfyUI workflow execution failed.".to_string());
    }
  }
}

fn build_comfyui_workflow(project: &ReduxProject, request: &serde_json::Value, image_name: &str) -> serde_json::Value {
  let settings = project.settings.get("imageAi").cloned().unwrap_or_default();
  let checkpoint = request.get("checkpoint").and_then(|v| v.as_str()).or_else(|| settings.get("checkpoint").and_then(|v| v.as_str())).unwrap_or("");
  let sampler = settings.get("sampler").and_then(|v| v.as_str()).unwrap_or("euler");
  let prompt = request.get("prompt").and_then(|v| v.as_str()).unwrap_or("");
  let negative = request.get("negativePrompt").and_then(|v| v.as_str()).unwrap_or("");
  let seed = request.get("seed").and_then(|v| v.as_i64()).unwrap_or(epoch_seconds() as i64);
  let steps = request.get("steps").and_then(|v| v.as_i64()).unwrap_or(24);
  let cfg = request.get("cfg").and_then(|v| v.as_f64()).unwrap_or(6.0);
  let denoise = request.get("strength").and_then(|v| v.as_f64()).unwrap_or(0.45);
  serde_json::json!({
    "1": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": checkpoint } },
    "2": { "class_type": "LoadImage", "inputs": { "image": image_name } },
    "3": { "class_type": "CLIPTextEncode", "inputs": { "text": prompt, "clip": ["1", 1] } },
    "4": { "class_type": "CLIPTextEncode", "inputs": { "text": negative, "clip": ["1", 1] } },
    "5": { "class_type": "VAEEncode", "inputs": { "pixels": ["2", 0], "vae": ["1", 2] } },
    "6": { "class_type": "KSampler", "inputs": { "seed": seed, "steps": steps, "cfg": cfg, "sampler_name": sampler, "scheduler": "normal", "denoise": denoise, "model": ["1", 0], "positive": ["3", 0], "negative": ["4", 0], "latent_image": ["5", 0] } },
    "7": { "class_type": "VAEDecode", "inputs": { "samples": ["6", 0], "vae": ["1", 2] } },
    "8": { "class_type": "SaveImage", "inputs": { "filename_prefix": "redux_ai_texture", "images": ["7", 0] } }
  })
}

fn write_image_ai_metadata(project: &ReduxProject, output_id: &str, texture_id: &str, output_path: Option<&Path>, request: &serde_json::Value, warnings: &[String], status: &str) -> CommandResult<String> {
  let output_dir = image_ai_output_dir(project)?;
  fs::create_dir_all(&output_dir).map_err(|error| error.to_string())?;
  let metadata_path = output_dir.join(format!("{output_id}.json"));
  let value = serde_json::json!({
    "outputId": output_id,
    "textureId": texture_id,
    "status": status,
    "provider": "comfyui",
    "sourcePngPath": request.get("sourcePngPath").and_then(|v| v.as_str()).unwrap_or(""),
    "outputPngPath": output_path.map(|path| path.to_string_lossy().to_string()),
    "prompt": request.get("prompt").and_then(|v| v.as_str()).unwrap_or(""),
    "negativePrompt": request.get("negativePrompt").and_then(|v| v.as_str()).unwrap_or(""),
    "seed": request.get("seed").and_then(|v| v.as_i64()).unwrap_or(0),
    "settingsUsed": project.settings.get("imageAi").cloned().unwrap_or_default(),
    "warnings": warnings,
    "createdAt": now_string()
  });
  write_json_file(&metadata_path, &value)?;
  Ok(metadata_path.to_string_lossy().to_string())
}

fn url_escape(value: &str) -> String {
  value
    .bytes()
    .flat_map(|byte| match byte {
      b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => vec![byte as char],
      _ => format!("%{byte:02X}").chars().collect(),
    })
    .collect()
}

fn read_u32_le(bytes: &[u8], offset: usize) -> u32 {
  u32::from_le_bytes(bytes[offset..offset + 4].try_into().unwrap_or([0, 0, 0, 0]))
}

fn texture_metadata_warnings(metadata: &TextureMetadata) -> Vec<String> {
  let mut warnings = metadata.warnings.clone();
  warnings.extend(texture_role_warnings(&metadata.role_guess));
  if metadata.width.is_none() || metadata.height.is_none() || metadata.format.is_none() {
    warnings.push("Missing metadata. Configure texconv or verify the DDS manually.".to_string());
  }
  if let (Some(width), Some(height)) = (metadata.width, metadata.height) {
    if (width as u64) * (height as u64) > 4096 * 4096 {
      warnings.push("Huge texture resolution. Conversion may be slow and memory-heavy.".to_string());
    }
    if !is_power_of_two(width) || !is_power_of_two(height) {
      warnings.push("Non-power-of-two dimensions. Some DDS/game pipelines expect power-of-two textures.".to_string());
    }
  }
  if metadata.mipmap_count.unwrap_or(1) > 1 {
    warnings.push("Mipmapped texture. Preserve or regenerate mipmaps before export.".to_string());
  }
  unique_strings(warnings)
}

fn guess_texture_role(path: &str) -> String {
  let text = path.to_ascii_lowercase();
  let rules = [
    ("normal", vec!["normal", "nrm", "_n.", "-n.", " bump"]),
    ("specular", vec!["spec", "specular", "_s."]),
    ("roughness", vec!["rough", "roughness"]),
    ("mask", vec!["mask", "_m."]),
    ("alpha", vec!["alpha", "opacity", "_a."]),
    ("diffuse", vec!["diffuse", "diff", "_d."]),
    ("albedo", vec!["albedo"]),
    ("color", vec!["color", "colour", "col"]),
    ("grass", vec!["grass", "foliage", "vegetation"]),
    ("tree", vec!["tree", "trunk", "bark", "leaf"]),
    ("bush", vec!["bush", "shrub"]),
    ("road", vec!["road", "asphalt", "street", "pavement"]),
    ("blood", vec!["blood", "wound"]),
    ("decal", vec!["decal", "graffiti", "stain"]),
    ("hud", vec!["hud"]),
    ("ui", vec!["ui", "frontend", "menu"]),
  ];
  rules
    .iter()
    .find(|(_, needles)| needles.iter().any(|needle| text.contains(needle)))
    .map(|(role, _)| (*role).to_string())
    .unwrap_or_else(|| "unknown".to_string())
}

fn texture_role_warnings(role: &str) -> Vec<String> {
  let mut warnings = Vec::new();
  if role == "normal" || role == "bump" {
    warnings.push("Possible normal map. Direction-encoded colors need manual review.".to_string());
  }
  if role == "mask" || role == "specular" || role == "roughness" {
    warnings.push("Possible mask/specular map. Channel meaning may be non-color data.".to_string());
  }
  if role == "alpha" {
    warnings.push("Alpha texture. Preserve transparency during PNG editing and DDS compile.".to_string());
  }
  warnings
}

fn is_power_of_two(value: u32) -> bool {
  value > 0 && (value & (value - 1)) == 0
}

fn safe_workspace_path_str(project: &ReduxProject, path: &str) -> CommandResult<PathBuf> {
  let workspace = PathBuf::from(project.workspace_path.clone().ok_or_else(|| "Project missing workspace path.".to_string())?);
  let workspace_root = workspace.canonicalize().map_err(|error| format!("Workspace path invalid: {error}"))?;
  let candidate = PathBuf::from(path);
  let canonical = candidate.canonicalize().map_err(|error| format!("Workspace texture path missing: {error}"))?;
  if !canonical.starts_with(&workspace_root) {
    return Err("Blocked unsafe texture path: target is outside project workspace.".to_string());
  }
  Ok(canonical)
}

fn texture_cache_dir(project: &ReduxProject, folder: &str) -> CommandResult<PathBuf> {
  let workspace = PathBuf::from(project.workspace_path.clone().ok_or_else(|| "Project missing workspace path.".to_string())?);
  Ok(workspace.join(".redux-ai").join(folder))
}

fn texture_converter_path(project: &ReduxProject) -> String {
  project
    .settings
    .get("textureTools")
    .and_then(|value| value.get("converterPath"))
    .and_then(|value| value.as_str())
    .or_else(|| project.settings.get("converterPaths").and_then(|value| value.get("ddsToImage")).and_then(|value| value.as_str()))
    .unwrap_or_default()
    .to_string()
}

fn texture_bool_setting(project: &ReduxProject, key: &str, default: bool) -> bool {
  project
    .settings
    .get("textureTools")
    .and_then(|value| value.get(key))
    .and_then(|value| value.as_bool())
    .unwrap_or(default)
}

fn texture_output_format(project: &ReduxProject, original: Option<&TextureMetadata>) -> String {
  let preserve = texture_bool_setting(project, "preserveOriginalFormat", true);
  if preserve {
    if let Some(format) = original.and_then(|metadata| metadata.format.as_ref()) {
      let mapped = match format.as_str() {
        "DXT1" | "BC1" => "BC1_UNORM",
        "DXT3" | "DXT5" | "BC3" => "BC3_UNORM",
        "ATI2" | "BC5" => "BC5_UNORM",
        _ => "",
      };
      if !mapped.is_empty() {
        return mapped.to_string();
      }
    }
  }
  project
    .settings
    .get("textureTools")
    .and_then(|value| value.get("defaultDdsFormat"))
    .and_then(|value| value.as_str())
    .unwrap_or("BC7_UNORM")
    .to_string()
}

fn command_output_text(output: &std::process::Output) -> String {
  let stdout = String::from_utf8_lossy(&output.stdout);
  let stderr = String::from_utf8_lossy(&output.stderr);
  format!("stdout:\n{}\nstderr:\n{}", stdout.trim(), stderr.trim())
}

fn unique_strings(values: Vec<String>) -> Vec<String> {
  let mut unique = Vec::new();
  for value in values {
    if !value.trim().is_empty() && !unique.contains(&value) {
      unique.push(value);
    }
  }
  unique
}

fn scan_content(file_path: &str, section: &str, content: &str) -> Vec<ScanMatch> {
  let keywords = keywords_for_section(section);
  content
    .lines()
    .enumerate()
    .flat_map(|(index, line)| {
      let lower = line.to_ascii_lowercase();
      keywords
        .iter()
        .filter(move |keyword| lower.contains(**keyword))
        .map(move |keyword| ScanMatch {
          file_path: file_path.to_string(),
          line: index + 1,
          keyword: (*keyword).to_string(),
          snippet: line.trim().chars().take(180).collect(),
        })
    })
    .collect()
}

fn keywords_for_section(section: &str) -> Vec<&'static str> {
  match section {
    "timecycle" => vec!["sky", "cloud", "fog", "bloom", "exposure", "sun", "moon", "shadow", "weather", "saturation", "contrast"],
    "tracers" => vec!["tracer", "bullet", "trail", "weapon", "muzzle", "projectile", "impact", "beam"],
    "hitEffects" => vec!["hit", "blood", "decal", "wound", "impact", "spark", "smoke", "dust", "particle"],
    "optimization" => vec!["grass", "veg", "bush", "tree", "trash", "debris", "rubbish", "garbage", "density", "lod", "reflection", "smoke"],
    "textures" => vec!["texture", "dds", "diffuse", "normal", "spec", "alpha", "mipmap", "grass", "tree", "road", "bush"],
    "killEffect" => vec!["kill", "death", "overlay", "nui", "script", "event", "animation", "sound"],
    _ => Vec::new(),
  }
}

fn load_project_file(path: &Path) -> CommandResult<ReduxProject> {
  let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
  let mut project: ReduxProject = serde_json::from_str(&content).map_err(|error| error.to_string())?;
  let root = path.parent().ok_or_else(|| "project.json has no parent folder.".to_string())?;
  project.project_root = Some(root.to_string_lossy().to_string());
  project.project_json_path = Some(path.to_string_lossy().to_string());
  project.workspace_path = Some(root.join("workspace").to_string_lossy().to_string());
  project.save_status = "Saved".to_string();
  Ok(project)
}

fn build_export_preview_value(project: &ReduxProject, export_name: &str, include_reports: bool, include_all_backups: bool, export_dir: Option<&Path>) -> CommandResult<serde_json::Value> {
  let export_id = format!("export-{}", epoch_seconds());
  let output_folder = export_dir
    .map(|path| path.to_string_lossy().to_string())
    .unwrap_or_else(|| {
      let root = project.project_root.clone().unwrap_or_default();
      Path::new(&root).join("exports").join(sanitize_file_name(export_name)).to_string_lossy().to_string()
    });
  let mut included_files = Vec::new();
  let mut excluded = Vec::new();
  let mut warnings = vec![
    "Manual export package only. No GTA archives or original game files are modified.".to_string(),
    "Import files manually with OpenIV or relevant tools.".to_string(),
  ];
  let mut included_sections: Vec<String> = Vec::new();

  for entry in &project.changelog_entries {
    let file_path = entry.get("filePath").and_then(|value| value.as_str()).unwrap_or_default();
    let patch_id = entry.get("patchId").and_then(|value| value.as_str()).unwrap_or_default();
    let section = entry.get("section").and_then(|value| value.as_str()).unwrap_or("dashboard");
    let Some(file) = project.files.iter().find(|file| file.relative_path == file_path) else {
      excluded.push(serde_json::json!({ "id": format!("patch-{patch_id}"), "label": file_path, "section": section, "reason": "Applied changelog target no longer exists in project files." }));
      continue;
    };
    if file.status != "text-readable" {
      excluded.push(serde_json::json!({ "id": format!("file-{}", file.id), "label": file.relative_path, "section": file.section, "reason": "Only patched text workspace files are eligible here." }));
      continue;
    }
    let source = PathBuf::from(&file.workspace_path);
    if !source.exists() {
      excluded.push(serde_json::json!({ "id": format!("file-{}", file.id), "label": file.relative_path, "section": file.section, "reason": "Workspace edited file missing." }));
      continue;
    }
    included_sections.push(section.to_string());
    included_files.push(serde_json::json!({
      "id": format!("text-{patch_id}"),
      "section": section,
      "type": "edited_text",
      "sourceWorkspacePath": file.workspace_path,
      "outputRelativePath": format!("edited_files/{}", normalize_relative(&file.relative_path)),
      "intendedGameRelativePath": file.relative_path,
      "originalPath": file.source_path,
      "originalHash": file_hash(Path::new(&file.workspace_path)).ok(),
      "sizeBytes": fs::metadata(&source).map(|m| m.len()).unwrap_or(0),
      "riskLevel": entry.get("risk").and_then(|value| value.as_str()).unwrap_or("medium"),
      "patchIds": [patch_id],
      "warnings": file.warnings
    }));
  }

  for review_value in &project.patch_reviews {
    let status = review_value.get("reviewStatus").and_then(|value| value.as_str()).unwrap_or("unknown");
    if status != "applied" {
      let title = review_value.pointer("/suggestion/title").and_then(|value| value.as_str()).unwrap_or("patch");
      let section = review_value.get("section").and_then(|value| value.as_str()).unwrap_or("dashboard");
      let reason = if status == "accepted" { "Accepted but not applied to workspace." } else { "Patch not applied; excluded." };
      if status == "accepted" {
        warnings.push(format!("{title}: accepted patch is unapplied and excluded."));
      }
      excluded.push(serde_json::json!({ "id": review_value.get("id").cloned().unwrap_or_default(), "label": title, "section": section, "reason": reason }));
    }
  }

  for texture in &project.textures {
    let file_name = texture.get("fileName").and_then(|value| value.as_str()).unwrap_or("texture.dds");
    let relative_path = normalize_relative(texture.get("relativePath").and_then(|value| value.as_str()).unwrap_or(""));
    let export_ready = texture.get("exportReady").and_then(|value| value.as_bool()).unwrap_or(false);
    let Some(compiled) = texture.get("compiledDdsPath").and_then(|value| value.as_str()).filter(|value| !value.is_empty()) else {
      if !export_ready {
        excluded.push(serde_json::json!({ "id": texture.get("textureId").cloned().unwrap_or_default(), "label": file_name, "section": "textures", "reason": "Texture not marked export-ready." }));
      }
      continue;
    };
    if !export_ready {
      excluded.push(serde_json::json!({ "id": texture.get("textureId").cloned().unwrap_or_default(), "label": file_name, "section": "textures", "reason": "Compiled DDS exists but not marked export-ready." }));
      continue;
    }
    let output_relative = if relative_path.is_empty() { format!("compiled_textures/unmapped/{file_name}") } else { format!("compiled_textures/{relative_path}") };
    if relative_path.is_empty() {
      warnings.push(format!("{file_name}: compiled texture has no intended relative path; exported under compiled_textures/unmapped."));
    }
    let texture_warnings = texture.get("warnings").and_then(|value| value.as_array()).cloned().unwrap_or_default();
    warnings.extend(texture_warnings.iter().filter_map(|value| value.as_str()).map(|value| format!("{file_name}: {value}")));
    included_sections.push("textures".to_string());
    included_files.push(serde_json::json!({
      "id": format!("texture-{}", texture.get("textureId").and_then(|value| value.as_str()).unwrap_or(file_name)),
      "section": "textures",
      "type": "compiled_texture",
      "sourceWorkspacePath": compiled,
      "outputRelativePath": output_relative,
      "intendedGameRelativePath": if relative_path.is_empty() { format!("unmapped/{file_name}") } else { relative_path },
      "originalPath": texture.get("originalPath").and_then(|value| value.as_str()).unwrap_or_default(),
      "sizeBytes": fs::metadata(compiled).map(|m| m.len()).unwrap_or(0),
      "riskLevel": if texture.get("roleGuess").and_then(|value| value.as_str()) == Some("normal") { "high" } else { "medium" },
      "patchIds": [],
      "textureId": texture.get("textureId").and_then(|value| value.as_str()).unwrap_or_default(),
      "warnings": texture.get("warnings").cloned().unwrap_or_else(|| serde_json::json!([]))
    }));
  }

  if include_all_backups {
    for backup in &project.backups {
      if let Some(path) = backup.get("backupPath").and_then(|value| value.as_str()) {
        let rel = backup.get("filePath").or_else(|| backup.get("workspacePath")).and_then(|value| value.as_str()).unwrap_or("backup");
        included_files.push(serde_json::json!({
          "id": backup.get("id").and_then(|value| value.as_str()).unwrap_or(path),
          "section": backup.get("section").and_then(|value| value.as_str()).unwrap_or("backups"),
          "type": "backup",
          "sourceWorkspacePath": path,
          "outputRelativePath": format!("original_backups/{}", normalize_relative(rel)),
          "intendedGameRelativePath": normalize_relative(rel),
          "sizeBytes": fs::metadata(path).map(|m| m.len()).unwrap_or(0),
          "riskLevel": "low",
          "patchIds": [backup.get("patchId").and_then(|value| value.as_str()).unwrap_or_default()],
          "warnings": []
        }));
      }
    }
  } else {
    for entry in &project.changelog_entries {
      if let Some(path) = entry.get("backupPath").and_then(|value| value.as_str()) {
        let rel = entry.get("filePath").and_then(|value| value.as_str()).unwrap_or("backup");
        included_files.push(serde_json::json!({
          "id": format!("backup-{}", entry.get("patchId").and_then(|value| value.as_str()).unwrap_or(rel)),
          "section": entry.get("section").and_then(|value| value.as_str()).unwrap_or("backups"),
          "type": "backup",
          "sourceWorkspacePath": path,
          "outputRelativePath": format!("original_backups/{}", normalize_relative(rel)),
          "intendedGameRelativePath": normalize_relative(rel),
          "sizeBytes": fs::metadata(path).map(|m| m.len()).unwrap_or(0),
          "riskLevel": entry.get("risk").and_then(|value| value.as_str()).unwrap_or("low"),
          "patchIds": [entry.get("patchId").and_then(|value| value.as_str()).unwrap_or_default()],
          "warnings": []
        }));
      }
    }
  }

  if include_reports {
    warnings.push("Reports folder included when report files exist.".to_string());
    for output in &project.image_generation_history {
      if let Some(path) = output.get("metadataPath").and_then(|value| value.as_str()).filter(|value| !value.is_empty()) {
        let name = Path::new(path).file_name().map(|value| value.to_string_lossy().to_string()).unwrap_or_else(|| "image_ai_metadata.json".to_string());
        included_files.push(serde_json::json!({
          "id": format!("image-ai-meta-{name}"),
          "section": "reports",
          "type": "report",
          "sourceWorkspacePath": path,
          "outputRelativePath": format!("reports/image_ai/{name}"),
          "intendedGameRelativePath": "reports only",
          "sizeBytes": fs::metadata(path).map(|m| m.len()).unwrap_or(0),
          "riskLevel": "low",
          "patchIds": [],
          "warnings": ["AI generation metadata only; compiled DDS remains the game-ready output."]
        }));
      }
    }
  }
  included_sections.sort();
  included_sections.dedup();
  warnings = unique_strings(warnings);
  let estimated_file_count = included_files.len() + if include_reports { 6 } else { 5 };
  let estimated_size: u64 = included_files.iter().filter_map(|value| value.get("sizeBytes").and_then(|size| size.as_u64())).sum();
  let blockers = export_blockers(project, export_name, &included_files);
  let install_notes_preview = build_install_notes_text(export_name, &included_files, &serde_json::json!(warnings));
  let manifest_preview = serde_json::json!({
    "exportId": export_id,
    "projectId": project.project_id,
    "projectName": project.project_name,
    "exportName": export_name,
    "appVersion": APP_VERSION,
    "includedSections": included_sections,
    "fileCount": included_files.len(),
    "files": included_files,
    "warnings": warnings,
    "installNotesPath": "install_notes.txt",
    "changelogPath": "changelog.md"
  });
  Ok(serde_json::json!({
    "exportId": export_id,
    "projectId": project.project_id,
    "projectName": project.project_name,
    "exportName": export_name,
    "outputFolder": output_folder,
    "includedSections": included_sections,
    "includedFiles": included_files,
    "excludedItems": excluded,
    "warnings": warnings,
    "blockers": blockers,
    "unappliedAcceptedPatches": project.patch_reviews.iter().filter(|review| review.get("reviewStatus").and_then(|value| value.as_str()) == Some("accepted")).count(),
    "highRiskChanges": manifest_preview["files"].as_array().unwrap_or(&Vec::new()).iter().filter(|file| file.get("riskLevel").and_then(|value| value.as_str()) == Some("high")).count(),
    "estimatedFileCount": estimated_file_count,
    "estimatedExportSizeBytes": estimated_size,
    "installNotesPreview": install_notes_preview,
    "manifestPreview": manifest_preview
  }))
}

fn export_blockers(project: &ReduxProject, export_name: &str, included_files: &[serde_json::Value]) -> Vec<String> {
  let mut blockers = Vec::new();
  if export_name.trim().is_empty() {
    blockers.push("Export name is empty.".to_string());
  }
  if project.save_status != "Saved" {
    blockers.push("Project has unsaved changes. Save before export.".to_string());
  }
  if included_files.is_empty() {
    blockers.push("No eligible files exist for export.".to_string());
  }
  if project.project_root.is_none() || project.workspace_path.is_none() {
    blockers.push("Project workspace folders are missing.".to_string());
  }
  blockers
}

fn versioned_export_path(base: &Path) -> PathBuf {
  if !base.exists() {
    return base.to_path_buf();
  }
  for index in 2..1000 {
    let candidate = PathBuf::from(format!("{}_{}", base.to_string_lossy(), index));
    if !candidate.exists() {
      return candidate;
    }
  }
  unique_path(base.to_path_buf())
}

fn safe_export_source_path(project: &ReduxProject, source: &str) -> CommandResult<PathBuf> {
  let candidate = PathBuf::from(source);
  let canonical = candidate.canonicalize().map_err(|error| format!("Export source missing: {error}"))?;
  let workspace = PathBuf::from(project.workspace_path.clone().ok_or_else(|| "Project missing workspace path.".to_string())?).canonicalize().map_err(|error| error.to_string())?;
  let root = PathBuf::from(project.project_root.clone().ok_or_else(|| "Project missing root.".to_string())?).canonicalize().map_err(|error| error.to_string())?;
  let allowed = [
    workspace.clone(),
    workspace.join(".redux-ai").join("texture-compiled"),
    root.join("backups"),
    root.join("reports"),
  ];
  if allowed.iter().any(|base| canonical.starts_with(base)) {
    Ok(canonical)
  } else {
    Err("Blocked unsafe export source outside workspace/backups/reports.".to_string())
  }
}

fn safe_export_destination(export_dir: &Path, output_relative: &str) -> CommandResult<PathBuf> {
  let safe_relative = normalize_relative(output_relative);
  let destination = export_dir.join(Path::new(&safe_relative));
  let parent = destination.parent().unwrap_or(export_dir);
  fs::create_dir_all(parent).map_err(|error| error.to_string())?;
  let export_root = export_dir.canonicalize().map_err(|error| error.to_string())?;
  let parent_canon = parent.canonicalize().map_err(|error| error.to_string())?;
  if !parent_canon.starts_with(&export_root) {
    return Err("Blocked unsafe export destination path traversal.".to_string());
  }
  Ok(destination)
}

fn copy_project_reports(project: &ReduxProject, export_dir: &Path) -> CommandResult<Vec<serde_json::Value>> {
  let mut records = Vec::new();
  let root = PathBuf::from(project.project_root.clone().ok_or_else(|| "Project missing root.".to_string())?);
  let reports = root.join("reports");
  if !reports.exists() {
    return Ok(records);
  }
  for entry in fs::read_dir(&reports).map_err(|error| error.to_string())? {
    let path = entry.map_err(|error| error.to_string())?.path();
    if !path.is_file() {
      continue;
    }
    let file_name = path.file_name().map(|value| value.to_string_lossy().to_string()).unwrap_or_else(|| "report.txt".to_string());
    let output_relative = format!("reports/{file_name}");
    let destination = safe_export_destination(export_dir, &output_relative)?;
    fs::copy(&path, &destination).map_err(|error| error.to_string())?;
    records.push(serde_json::json!({
      "id": format!("report-{file_name}"),
      "section": "reports",
      "type": "report",
      "sourceWorkspacePath": path.to_string_lossy(),
      "outputRelativePath": output_relative,
      "intendedGameRelativePath": "reports only",
      "outputHash": file_hash(&destination)?,
      "sizeBytes": fs::metadata(&destination).map(|m| m.len()).unwrap_or(0),
      "riskLevel": "low",
      "patchIds": [],
      "warnings": []
    }));
  }
  Ok(records)
}

fn build_manifest_value(project: &ReduxProject, export_name: &str, export_id: &str, export_dir: &Path, files: &[serde_json::Value], warnings: serde_json::Value) -> serde_json::Value {
  let sections: Vec<String> = unique_strings(files.iter().filter_map(|file| file.get("section").and_then(|value| value.as_str()).map(|value| value.to_string())).collect());
  let size: u64 = files.iter().filter_map(|file| file.get("sizeBytes").and_then(|value| value.as_u64())).sum();
  serde_json::json!({
    "exportId": export_id,
    "projectId": project.project_id,
    "projectName": project.project_name,
    "exportName": export_name,
    "createdAt": now_string(),
    "appVersion": APP_VERSION,
    "includedSections": sections,
    "fileCount": files.len(),
    "exportSizeBytes": size,
    "files": files,
    "patches": project.changelog_entries,
    "textures": project.textures.iter().filter(|texture| texture.get("exportReady").and_then(|value| value.as_bool()).unwrap_or(false)).collect::<Vec<_>>(),
    "backups": files.iter().filter(|file| file.get("type").and_then(|value| value.as_str()) == Some("backup")).collect::<Vec<_>>(),
    "reports": files.iter().filter(|file| file.get("type").and_then(|value| value.as_str()) == Some("report")).collect::<Vec<_>>(),
    "warnings": warnings,
    "installNotesPath": "install_notes.txt",
    "changelogPath": "changelog.md",
    "exportPath": export_dir.to_string_lossy()
  })
}

fn build_install_notes_text(export_name: &str, files: &[serde_json::Value], warnings: &serde_json::Value) -> String {
  let mut lines = vec![
    format!("Redux AI Assistant export: {export_name}"),
    String::new(),
    "This export does not install anything automatically.".to_string(),
    "Original game files were not modified.".to_string(),
    "Do not copy this package directly into update.rpf. Use OpenIV or relevant tools manually.".to_string(),
    "edited_files/ contains changed text/config files.".to_string(),
    "compiled_textures/ contains ready DDS outputs.".to_string(),
    "original_backups/ contains workspace backups from edits.".to_string(),
    "reports/ contains AI, scan, validation, and texture reports.".to_string(),
    String::new(),
    "Recommended install order: warnings, text configs, textures, scripts/resources, then in-game test.".to_string(),
    String::new(),
    "File mapping:".to_string(),
  ];
  for file in files {
    let out = file.get("outputRelativePath").and_then(|value| value.as_str()).unwrap_or("");
    let target = file.get("intendedGameRelativePath").and_then(|value| value.as_str()).unwrap_or("");
    lines.push(format!("{out}\n-> intended location:\n{target}"));
  }
  lines.push(String::new());
  lines.push("Warnings/high-risk:".to_string());
  if let Some(items) = warnings.as_array() {
    for warning in items {
      if let Some(text) = warning.as_str() {
        lines.push(format!("- {text}"));
      }
    }
  }
  lines.join("\n")
}

fn build_export_changelog(project: &ReduxProject, export_name: &str, files: &[serde_json::Value], warnings: &serde_json::Value) -> String {
  let mut lines = vec![
    "# Redux AI Assistant Export Changelog".to_string(),
    String::new(),
    format!("Project: {}", project.project_name),
    format!("Export: {export_name}"),
    format!("Timestamp: {}", now_string()),
    String::new(),
    "## Applied Patches".to_string(),
  ];
  for entry in &project.changelog_entries {
    lines.push(format!("- {} -> {}", entry.get("suggestionTitle").and_then(|v| v.as_str()).unwrap_or("patch"), entry.get("filePath").and_then(|v| v.as_str()).unwrap_or("file")));
  }
  lines.push(String::new());
  lines.push("## Compiled Textures".to_string());
  for file in files.iter().filter(|file| file.get("type").and_then(|value| value.as_str()) == Some("compiled_texture")) {
    lines.push(format!("- {}", file.get("outputRelativePath").and_then(|value| value.as_str()).unwrap_or("texture")));
  }
  lines.push(String::new());
  lines.push("## Backups".to_string());
  for file in files.iter().filter(|file| file.get("type").and_then(|value| value.as_str()) == Some("backup")) {
    lines.push(format!("- {}", file.get("outputRelativePath").and_then(|value| value.as_str()).unwrap_or("backup")));
  }
  lines.push(String::new());
  lines.push("## Warnings".to_string());
  if let Some(items) = warnings.as_array() {
    for warning in items.iter().filter_map(|value| value.as_str()) {
      lines.push(format!("- {warning}"));
    }
  }
  lines.push(String::new());
  lines.push("## Testing Checklist".to_string());
  lines.push("- Test one section at a time.".to_string());
  lines.push("- Verify textures with alpha/normal/mipmap warnings in game.".to_string());
  lines.push("- Keep original backups until final QA passes.".to_string());
  lines.join("\n")
}

fn build_warnings_md(preview: &serde_json::Value) -> String {
  let mut lines = vec!["# Export Warnings".to_string(), String::new(), "## Unresolved Warnings".to_string()];
  for warning in preview.get("warnings").and_then(|value| value.as_array()).into_iter().flatten().filter_map(|value| value.as_str()) {
    lines.push(format!("- {warning}"));
  }
  lines.push(String::new());
  lines.push("## Excluded Items".to_string());
  for item in preview.get("excludedItems").and_then(|value| value.as_array()).into_iter().flatten() {
    let label = item.get("label").and_then(|value| value.as_str()).unwrap_or("item");
    let reason = item.get("reason").and_then(|value| value.as_str()).unwrap_or("excluded");
    lines.push(format!("- {label}: {reason}"));
  }
  lines.push(String::new());
  lines.push("## Blockers".to_string());
  for blocker in preview.get("blockers").and_then(|value| value.as_array()).into_iter().flatten().filter_map(|value| value.as_str()) {
    lines.push(format!("- {blocker}"));
  }
  lines.join("\n")
}

fn validate_export_dir(export_dir: &Path, manifest: &serde_json::Value) -> CommandResult<serde_json::Value> {
  let mut errors = Vec::new();
  let mut warnings = Vec::new();
  for required in ["manifest.json", "install_notes.txt", "changelog.md", "warnings.md"] {
    if !export_dir.join(required).exists() {
      errors.push(format!("Required file missing: {required}"));
    }
  }
  let export_root = export_dir.canonicalize().map_err(|error| error.to_string())?;
  for file in manifest.get("files").and_then(|value| value.as_array()).into_iter().flatten() {
    let output = file.get("outputRelativePath").and_then(|value| value.as_str()).unwrap_or("");
    let path = safe_export_destination(export_dir, output)?;
    if !path.exists() {
      errors.push(format!("Manifest output missing: {output}"));
      continue;
    }
    let canon = path.canonicalize().map_err(|error| error.to_string())?;
    if !canon.starts_with(&export_root) {
      errors.push(format!("Output outside export folder: {output}"));
    }
    if fs::metadata(&path).map(|metadata| metadata.len()).unwrap_or(0) == 0 {
      warnings.push(format!("Output file is empty: {output}"));
    }
    if let Some(expected) = file.get("outputHash").and_then(|value| value.as_str()) {
      let actual = file_hash(&path)?;
      if actual != expected {
        errors.push(format!("Hash mismatch: {output}"));
      }
    }
  }
  if manifest.get("warnings").and_then(|value| value.as_array()).map(|value| value.is_empty()).unwrap_or(true) {
    warnings.push("No warnings recorded in manifest.".to_string());
  }
  Ok(serde_json::json!({ "ok": errors.is_empty(), "errors": errors, "warnings": warnings }))
}

fn write_json_file(path: &Path, value: &serde_json::Value) -> CommandResult<()> {
  let content = serde_json::to_string_pretty(value).map_err(|error| error.to_string())?;
  fs::write(path, content).map_err(|error| error.to_string())
}

fn file_hash(path: &Path) -> CommandResult<String> {
  let bytes = fs::read(path).map_err(|error| error.to_string())?;
  let mut hash: u64 = 0xcbf29ce484222325;
  for byte in bytes {
    hash ^= byte as u64;
    hash = hash.wrapping_mul(0x100000001b3);
  }
  Ok(format!("fnv1a64:{hash:016x}"))
}

fn save_project_file(project: &mut ReduxProject) -> CommandResult<()> {
  let project_json_path = project
    .project_json_path
    .clone()
    .ok_or_else(|| "Project has no project.json path.".to_string())?;
  project.updated_at = now_string();
  project.save_status = "Saved".to_string();
  let content = serde_json::to_string_pretty(project).map_err(|error| error.to_string())?;
  fs::write(project_json_path, content).map_err(|error| error.to_string())
}

fn save_report(project: &ReduxProject, section: &str, kind: &str, content: &str) -> CommandResult<()> {
  let root = project.project_root.as_ref().ok_or_else(|| "Project missing project root.".to_string())?;
  let reports = Path::new(root).join("reports");
  fs::create_dir_all(&reports).map_err(|error| error.to_string())?;
  let file_name = format!("{}_{}_{}.md", sanitize_file_name(section), kind, epoch_seconds());
  fs::write(reports.join(file_name), content).map_err(|error| error.to_string())
}

fn save_named_report(project: &ReduxProject, file_name: &str, content: &str) -> CommandResult<()> {
  let root = project.project_root.as_ref().ok_or_else(|| "Project missing project root.".to_string())?;
  let reports = Path::new(root).join("reports");
  fs::create_dir_all(&reports).map_err(|error| error.to_string())?;
  fs::write(reports.join(file_name), content).map_err(|error| error.to_string())
}

fn build_texture_report(project: &ReduxProject, notes: String) -> String {
  let mut lines = vec![
    "# Texture Workflow Report".to_string(),
    String::new(),
    format!("Project: {}", project.project_name),
    format!("Generated: {}", now_string()),
    String::new(),
    "## Textures".to_string(),
  ];
  for texture in &project.textures {
    let file = texture.get("fileName").and_then(|v| v.as_str()).unwrap_or("unknown");
    let status = texture.get("conversionStatus").and_then(|v| v.as_str()).unwrap_or("unknown");
    let ready = texture.get("exportReady").and_then(|v| v.as_bool()).unwrap_or(false);
    let role = texture.get("roleGuess").and_then(|v| v.as_str()).unwrap_or("unknown");
    lines.push(format!("- `{file}` role `{role}` status `{status}` exportReady `{ready}`"));
    for key in ["originalPath", "workspacePath", "previewPngPath", "editedPngPath", "compiledDdsPath"] {
      if let Some(value) = texture.get(key).and_then(|v| v.as_str()).filter(|v| !v.is_empty()) {
        lines.push(format!("  - {key}: `{value}`"));
      }
    }
    if let Some(warnings) = texture.get("warnings").and_then(|v| v.as_array()) {
      for warning in warnings.iter().filter_map(|v| v.as_str()) {
        lines.push(format!("  - Warning: {warning}"));
      }
    }
  }
  lines.push(String::new());
  lines.push("## Manual Notes".to_string());
  lines.push(if notes.trim().is_empty() { "No manual notes.".to_string() } else { notes });
  lines.join("\n")
}

fn extract_assistant_content(raw: &str) -> String {
  let Ok(value) = serde_json::from_str::<serde_json::Value>(raw) else {
    return String::new();
  };
  value
    .get("choices")
    .and_then(|choices| choices.as_array())
    .and_then(|choices| choices.first())
    .and_then(|choice| choice.get("message"))
    .and_then(|message| message.get("content"))
    .and_then(|content| content.as_str())
    .unwrap_or_default()
    .to_string()
}

fn openrouter_status_error(status_code: u16, body: &str) -> String {
  let kind = match status_code {
    401 | 403 => "Invalid or unauthorized OpenRouter API key.",
    404 => "Invalid OpenRouter endpoint or model route.",
    408 => "OpenRouter request timed out.",
    429 => "OpenRouter rate limit hit.",
    400 => "OpenRouter rejected the request. Check model name and payload.",
    _ => "OpenRouter API error.",
  };
  let body_preview: String = body.chars().take(500).collect();
  format!("{kind} HTTP {status_code}. {body_preview}")
}

fn validate_one_patch(project: &ReduxProject, review: &PatchReviewState) -> PatchValidationResult {
  let suggestion = &review.suggestion;
  let testing_notes = suggestion.testing_notes.clone().unwrap_or_default();
  let base = |status: &str, message: String, can_apply: bool, match_count: usize, match_locations: Vec<PatchMatchLocation>, file: Option<&ProjectFile>| {
    PatchValidationResult {
      id: review.id.clone(),
      suggestion_id: review.suggestion_id.clone(),
      section: review.section.clone(),
      target_file_path: suggestion.target_file_path.clone(),
      workspace_path: file.map(|value| value.workspace_path.clone()),
      status: status.to_string(),
      message,
      can_apply,
      match_count,
      match_locations,
      original_snippet: suggestion.patch.as_ref().map(|patch| patch.find.clone()),
      proposed_snippet: suggestion.patch.as_ref().map(|patch| patch.replace.clone()),
      risk: suggestion.risk.clone(),
      reason: suggestion.reason.clone(),
      testing_notes: testing_notes.clone(),
      change_type: suggestion.change_type.clone(),
    }
  };

  let Some(file) = project.files.iter().find(|file| file.relative_path == suggestion.target_file_path) else {
    return base("missing_target_file", "Target file does not match an imported project file.".to_string(), false, 0, Vec::new(), None);
  };

  if file.status != "text-readable" {
    return base("unsupported_file_type", "Unsupported/binary files cannot receive find/replace patches.".to_string(), false, 0, Vec::new(), Some(file));
  }

  if suggestion.change_type != "find_replace" {
    return base("requires_manual_review", "Manual/report-only suggestions are not auto-applied.".to_string(), false, 0, Vec::new(), Some(file));
  }

  let Some(patch) = suggestion.patch.as_ref() else {
    return base("cannot_apply", "find_replace suggestion has no patch payload.".to_string(), false, 0, Vec::new(), Some(file));
  };
  if patch.find.trim().is_empty() {
    return base("cannot_apply", "patch.find is empty.".to_string(), false, 0, Vec::new(), Some(file));
  }
  if patch.replace.trim().is_empty() {
    return base("cannot_apply", "patch.replace is empty. Empty replace needs explicit future support.".to_string(), false, 0, Vec::new(), Some(file));
  }

  let path = match safe_workspace_file_path(project, file) {
    Ok(value) => value,
    Err(error) => return base("missing_target_file", error, false, 0, Vec::new(), Some(file)),
  };
  let content = match fs::read_to_string(&path) {
    Ok(value) => value,
    Err(error) => return base("missing_target_file", format!("Target workspace file cannot be read: {error}"), false, 0, Vec::new(), Some(file)),
  };

  let count = content.matches(&patch.find).count();
  let locations = match_locations(&content, &patch.find);
  if count == 0 {
    let status = if content.contains(&patch.replace) { "already_applied" } else { "cannot_apply" };
    let message = if status == "already_applied" {
      "Replacement already appears in workspace file.".to_string()
    } else {
      "patch.find was not found in workspace file.".to_string()
    };
    return base(status, message, false, count, locations, Some(file));
  }
  if count > 1 {
    return base("ambiguous_match", "patch.find appears multiple times. Manual match choice required.".to_string(), false, count, locations, Some(file));
  }

  let proposed = content.replacen(&patch.find, &patch.replace, 1);
  if let Err(error) = validate_syntax_for_extension(&file.extension, &proposed) {
    return base("invalid_syntax_after_patch", error, false, count, locations, Some(file));
  }

  base("can_apply", "Patch can apply to project-local workspace copy. Review diff before accepting.".to_string(), true, count, locations, Some(file))
}

fn apply_reviews_to_workspace(mut project: ReduxProject, reviews: Vec<PatchReviewState>) -> CommandResult<ReduxProject> {
  ensure_project_ready(&project)?;
  let batch_id = format!("patch_batch_{}", epoch_seconds());
  let timestamp = now_string();
  let mut updated_reviews = existing_reviews(&project);
  let mut applied_ids: Vec<String> = Vec::new();
  let mut failed_count = 0usize;
  let mut batch_backup_root: Option<String> = None;

  for mut review in reviews.into_iter().filter(|review| review.review_status == "accepted") {
    let validation = validate_one_patch(&project, &review);
    review.validation = Some(validation.clone());
    if !validation.can_apply {
      review.review_status = "failed".to_string();
      review.error = Some(validation.message.clone());
      failed_count += 1;
      upsert_review(&mut updated_reviews, review);
      continue;
    }

    let file_index = project
      .files
      .iter()
      .position(|file| file.relative_path == review.suggestion.target_file_path)
      .ok_or_else(|| "Validated file disappeared before apply.".to_string())?;
    let file = project.files[file_index].clone();
    let patch = review.suggestion.patch.clone().ok_or_else(|| "Missing patch payload.".to_string())?;
    let path = safe_workspace_file_path(&project, &file)?;
    let content = fs::read_to_string(&path).map_err(|error| error.to_string())?;
    let next_content = content.replacen(&patch.find, &patch.replace, 1);
    validate_syntax_for_extension(&file.extension, &next_content)?;
    let backup_path = backup_workspace_file(&project, &file, &batch_id, &review.id)?;
    batch_backup_root = backup_path.parent().map(|path| path.to_string_lossy().to_string());
    atomic_write(&path, &next_content)?;

    project.files[file_index].preview = Some(preview_text(&next_content));
    let backup = serde_json::json!({
      "id": format!("backup-{}", review.id),
      "backupPath": backup_path.to_string_lossy(),
      "workspacePath": path.to_string_lossy(),
      "timestamp": timestamp,
      "patchId": review.id,
      "suggestionId": review.suggestion_id,
      "section": review.section,
      "reason": review.suggestion.reason
    });
    let changelog = serde_json::json!({
      "id": format!("change-{}", review.id),
      "timestamp": timestamp,
      "section": review.section,
      "filePath": file.relative_path,
      "patchId": review.id,
      "suggestionTitle": review.suggestion.title,
      "risk": review.suggestion.risk,
      "summary": review.suggestion.reason,
      "backupPath": backup_path.to_string_lossy(),
      "applyStatus": "applied"
    });
    let apply_result = serde_json::json!({
      "patchId": review.id,
      "suggestionId": review.suggestion_id,
      "status": "applied",
      "message": "Workspace patch applied. Original source file untouched.",
      "backup": backup,
      "changelog": changelog
    });
    project.backups.push(backup);
    project.changelog_entries.push(changelog);
    project.applied_patches.push(apply_result);
    applied_ids.push(review.id.clone());
    review.review_status = "applied".to_string();
    review.applied_at = Some(timestamp.clone());
    upsert_review(&mut updated_reviews, review);
  }

  project.patch_reviews = updated_reviews.into_iter().map(|review| serde_json::to_value(review).unwrap_or_default()).collect();
  let applied_count = applied_ids.len();
  project.patch_batches.push(serde_json::json!({
    "id": batch_id,
    "timestamp": timestamp,
    "patchIds": applied_ids,
    "appliedCount": applied_count,
    "failedCount": failed_count,
    "backupRoot": batch_backup_root
  }));
  write_changelog_report(&project)?;
  save_project_file(&mut project)?;
  Ok(project)
}

fn existing_reviews(project: &ReduxProject) -> Vec<PatchReviewState> {
  project
    .patch_reviews
    .iter()
    .filter_map(|value| serde_json::from_value::<PatchReviewState>(value.clone()).ok())
    .collect()
}

fn upsert_review(reviews: &mut Vec<PatchReviewState>, review: PatchReviewState) {
  if let Some(existing) = reviews.iter_mut().find(|item| item.id == review.id) {
    *existing = review;
  } else {
    reviews.push(review);
  }
}

fn safe_workspace_file_path(project: &ReduxProject, file: &ProjectFile) -> CommandResult<PathBuf> {
  let workspace = PathBuf::from(project.workspace_path.clone().ok_or_else(|| "Project missing workspace path.".to_string())?);
  let workspace_root = workspace.canonicalize().map_err(|error| format!("Workspace path invalid: {error}"))?;
  let candidate = PathBuf::from(&file.workspace_path);
  let canonical = candidate.canonicalize().map_err(|error| format!("Target workspace file missing: {error}"))?;
  if !canonical.starts_with(&workspace_root) {
    return Err("Blocked unsafe path: target is outside project workspace.".to_string());
  }
  Ok(canonical)
}

fn backup_workspace_file(project: &ReduxProject, file: &ProjectFile, batch_id: &str, patch_id: &str) -> CommandResult<PathBuf> {
  let root = PathBuf::from(project.project_root.clone().ok_or_else(|| "Project missing project root.".to_string())?);
  let source = safe_workspace_file_path(project, file)?;
  let safe_relative = normalize_relative(&file.relative_path);
  let destination = root.join("backups").join(batch_id).join(Path::new(&safe_relative));
  if let Some(parent) = destination.parent() {
    fs::create_dir_all(parent).map_err(|error| error.to_string())?;
  }
  fs::copy(&source, &destination).map_err(|error| format!("Backup failed for {patch_id}: {error}"))?;
  Ok(destination)
}

fn atomic_write(path: &Path, content: &str) -> CommandResult<()> {
  let tmp = path.with_extension(format!("{}.tmp", path.extension().map(|value| value.to_string_lossy()).unwrap_or_default()));
  fs::write(&tmp, content).map_err(|error| error.to_string())?;
  if path.exists() {
    fs::remove_file(path).map_err(|error| error.to_string())?;
  }
  fs::rename(&tmp, path).map_err(|error| error.to_string())
}

fn match_locations(content: &str, needle: &str) -> Vec<PatchMatchLocation> {
  content
    .lines()
    .enumerate()
    .filter(|(_, line)| line.contains(needle))
    .map(|(index, line)| PatchMatchLocation {
      line: index + 1,
      preview: line.trim().chars().take(180).collect(),
    })
    .collect()
}

fn validate_syntax_for_extension(extension: &str, content: &str) -> CommandResult<()> {
  if content.trim().is_empty() {
    return Err("Resulting file would be empty/corrupted.".to_string());
  }
  match extension {
    ".json" => serde_json::from_str::<serde_json::Value>(content).map(|_| ()).map_err(|error| format!("JSON syntax failed after patch: {error}")),
    ".xml" | ".meta" => validate_basic_xml(content),
    _ => Ok(()),
  }
}

fn validate_basic_xml(content: &str) -> CommandResult<()> {
  let trimmed = content.trim();
  if !trimmed.starts_with('<') {
    return Err("XML/meta content no longer starts with a tag.".to_string());
  }
  let open_count = trimmed.matches('<').count();
  let close_count = trimmed.matches('>').count();
  if open_count != close_count {
    return Err("XML/meta tag brackets are unbalanced after patch.".to_string());
  }
  Ok(())
}

fn write_changelog_report(project: &ReduxProject) -> CommandResult<()> {
  let root = project.project_root.as_ref().ok_or_else(|| "Project missing project root.".to_string())?;
  let reports = Path::new(root).join("reports");
  fs::create_dir_all(&reports).map_err(|error| error.to_string())?;
  let mut lines = vec!["# Redux AI Assistant Changelog".to_string(), String::new()];
  for entry in &project.changelog_entries {
    let timestamp = entry.get("timestamp").and_then(|value| value.as_str()).unwrap_or("");
    let section = entry.get("section").and_then(|value| value.as_str()).unwrap_or("");
    let file_path = entry.get("filePath").and_then(|value| value.as_str()).unwrap_or("");
    let title = entry.get("suggestionTitle").and_then(|value| value.as_str()).unwrap_or("");
    let backup = entry.get("backupPath").and_then(|value| value.as_str()).unwrap_or("");
    lines.push(format!("- `{timestamp}` [{section}] {title} -> `{file_path}`"));
    lines.push(format!("  - Backup: `{backup}`"));
  }
  fs::write(reports.join("changelog.md"), lines.join("\n")).map_err(|error| error.to_string())
}

fn ensure_project_ready(project: &ReduxProject) -> CommandResult<()> {
  let root = project.project_root.as_ref().ok_or_else(|| "Create or open a project first.".to_string())?;
  let workspace = project.workspace_path.as_ref().ok_or_else(|| "Project missing workspace path.".to_string())?;
  create_project_dirs(Path::new(root))?;
  fs::create_dir_all(workspace).map_err(|error| error.to_string())?;
  Ok(())
}

fn contains_any(text: &str, keywords: &[&str]) -> bool {
  keywords.iter().any(|keyword| text.contains(keyword))
}

fn preview_text(content: &str) -> String {
  content.lines().take(220).collect::<Vec<_>>().join("\n")
}

fn read_text_limited(path: &Path, max_bytes: usize, max_line_chars: usize) -> CommandResult<TextReadResult> {
  let bytes = fs::read(path).map_err(|error| error.to_string())?;
  let mut warning = None;
  if looks_binary(&bytes) {
    return Err("File looks binary despite text-readable extension.".to_string());
  }
  let slice = if bytes.len() > max_bytes {
    warning = Some(format!("Large file scanned partially: first {max_bytes} bytes of {} bytes.", bytes.len()));
    &bytes[..max_bytes]
  } else {
    &bytes[..]
  };
  let decoded = decode_text(slice);
  let text = decoded
    .lines()
    .map(|line| line.chars().take(max_line_chars).collect::<String>())
    .collect::<Vec<_>>()
    .join("\n");
  Ok(TextReadResult { text, warning })
}

fn decode_text(bytes: &[u8]) -> String {
  if bytes.starts_with(&[0xFF, 0xFE]) {
    let words = bytes[2..].chunks_exact(2).map(|chunk| u16::from_le_bytes([chunk[0], chunk[1]])).collect::<Vec<_>>();
    return String::from_utf16_lossy(&words);
  }
  if bytes.starts_with(&[0xFE, 0xFF]) {
    let words = bytes[2..].chunks_exact(2).map(|chunk| u16::from_be_bytes([chunk[0], chunk[1]])).collect::<Vec<_>>();
    return String::from_utf16_lossy(&words);
  }
  String::from_utf8_lossy(bytes).to_string()
}

fn looks_binary(bytes: &[u8]) -> bool {
  let sample = &bytes[..bytes.len().min(4096)];
  sample.iter().filter(|byte| **byte == 0).count() > 8
}

fn max_scan_bytes(project: &ReduxProject) -> usize {
  project.settings.get("limits").and_then(|v| v.get("maxScanBytes")).and_then(|v| v.as_u64()).unwrap_or(2_097_152) as usize
}

fn max_line_chars(project: &ReduxProject) -> usize {
  project.settings.get("limits").and_then(|v| v.get("maxLinePreviewChars")).and_then(|v| v.as_u64()).unwrap_or(240) as usize
}

fn max_scan_results(project: &ReduxProject) -> usize {
  project.settings.get("limits").and_then(|v| v.get("maxScanResults")).and_then(|v| v.as_u64()).unwrap_or(500) as usize
}

fn normalize_relative(relative_path: &str) -> String {
  relative_path
    .replace('\\', "/")
    .split('/')
    .filter(|part| !part.is_empty() && *part != "." && *part != "..")
    .collect::<Vec<_>>()
    .join("/")
}

fn sanitize_file_name(value: &str) -> String {
  let sanitized = value
    .chars()
    .map(|ch| if ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' || ch == ' ' { ch } else { '_' })
    .collect::<String>()
    .trim()
    .replace(' ', "_");
  if sanitized.is_empty() {
    "Redux_AI_Project".to_string()
  } else {
    sanitized
  }
}

fn unique_path(path: PathBuf) -> PathBuf {
  if !path.exists() {
    return path;
  }
  let mut candidate = path.clone();
  let suffix = epoch_seconds();
  let name = path.file_name().map(|value| value.to_string_lossy().to_string()).unwrap_or_else(|| "Project".to_string());
  candidate.set_file_name(format!("{name}_{suffix}"));
  candidate
}

fn now_string() -> String {
  format!("{}", epoch_seconds())
}

fn epoch_seconds() -> u64 {
  SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs()
}

fn epoch_millis() -> u128 {
  SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_millis()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      create_project,
      open_project,
      import_files,
      import_folder,
      scan_project,
      save_project,
      export_project,
      build_export_preview,
      create_export_package,
      validate_export_package,
      open_export_folder,
      save_install_notes,
      save_export_manifest,
      test_comfyui_connection,
      list_comfyui_models,
      send_comfyui_image_to_image,
      get_comfyui_job_status,
      download_comfyui_output,
      cancel_comfyui_job,
      save_prompt_report,
      save_ai_response_report,
      inspect_dds_metadata,
      inspect_texture_metadata,
      check_texture_tools,
      convert_dds_to_png,
      import_edited_texture_png,
      convert_png_to_dds,
      save_texture_report,
      send_openrouter_chat_request,
      read_workspace_file,
      reveal_in_file_manager,
      write_workspace_file,
      create_workspace_backup,
      validate_patch,
      validate_patches,
      apply_patch_to_workspace,
      apply_accepted_patches
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
