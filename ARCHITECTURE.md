# Architecture

React frontend talks to Tauri commands for local file operations. Project data lives in `project.json`. Source files are copied into `workspace/`. Reports, backups, exports, texture previews, and AI outputs are project-local.

Safety rule: write only inside project-owned folders.
