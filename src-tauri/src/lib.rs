use serde::{Deserialize, Serialize};
use std::{
  collections::HashMap,
  fs,
  path::{Path, PathBuf},
  time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tauri::Manager;
use walkdir::WalkDir;

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
  for file in project.files.iter_mut() {
    file.scan_matches.clear();
    if file.status != "text-readable" {
      continue;
    }
    let path = PathBuf::from(&file.workspace_path);
    let content = fs::read_to_string(&path).map_err(|error| format!("Failed reading {}: {error}", file.relative_path))?;
    file.preview = Some(preview_text(&content));
    file.scan_matches = scan_content(&file.relative_path, &file.section, &content);
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
    message: "Phase 2 mock export only. Real copy/export writing starts in Phase 3.".to_string(),
  })
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
    fs::read_to_string(&destination).ok().map(|content| preview_text(&content))
  } else {
    None
  };

  project.files.push(ProjectFile {
    id: format!("file-{}", epoch_millis()),
    source_path: source.to_string_lossy().to_string(),
    workspace_path: destination.to_string_lossy().to_string(),
    relative_path: safe_relative,
    file_name,
    extension,
    size_bytes: metadata.len(),
    status,
    section,
    warnings,
    scan_matches: Vec::new(),
    preview,
  });
  project.updated_at = now_string();
  project.save_status = "Saved".to_string();
  Ok(())
}

fn detect_status(extension: &str) -> String {
  match extension {
    ".xml" | ".dat" | ".meta" | ".ini" | ".txt" | ".json" | ".cfg" => "text-readable",
    ".rpf" | ".ytd" | ".ypt" | ".ydr" | ".ydd" | ".awc" | ".dds" => "binary-unsupported",
    _ => "unsupported",
  }
  .to_string()
}

fn classify_section(relative_path: &str, extension: &str) -> String {
  let text = relative_path.to_ascii_lowercase();
  if extension == ".dds" || contains_any(&text, &["texture", ".ytd", "diffuse", "normal", "spec", "alpha", "mipmap", "road"]) {
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
  if status == "binary-unsupported" {
    warnings.push(format!("{extension} is binary/unsupported in Phase 2. File is copied but not read or edited."));
  } else if status == "unsupported" {
    warnings.push(format!("{extension} is not supported yet. File is copied for tracking only."));
  }
  warnings
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
      save_prompt_report,
      save_ai_response_report,
      send_openrouter_chat_request,
      read_workspace_file,
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
