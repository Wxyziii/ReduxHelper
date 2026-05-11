# Master Prompt for AI Coding Agent

You are building a desktop app called Redux AI Assistant.

Read the docs in this starter pack before coding.

Goal:
Build a local-first desktop app that helps users organize, analyze, AI-edit, review, and export GTA V visual redux/mod files safely.

Core requirements:
- The app has section pages: Dashboard, Timecycle, Tracers, Hit Effects, Kill Effect, Optimization, Textures, Export, Settings.
- Each section can have its own files.
- The user writes a goal per section.
- The app scans files and generates section-specific AI prompts.
- The AI returns structured JSON edit suggestions.
- The app validates patches and shows diffs.
- The user accepts or rejects changes.
- The app exports accepted changes into a new named folder while preserving original relative paths.
- The app never modifies original source files directly.
- The app creates backups, manifest.json, reports, install_notes.txt, and changelog.md.

Build phases:
1. Static UI prototype with mock data.
2. Project state and local storage.
3. File import and scanner.
4. AI prompt builder.
5. OpenRouter-compatible API client.
6. AI response parser.
7. Patch validator and diff viewer.
8. Export manager.
9. Texture/DDS workflow.

Do not build:
- Direct RPF editing.
- Direct YTD/YPT editing.
- Gameplay cheat features.
- Memory readers.
- Automatic mass editing.
- Any anti-cheat bypass logic.

Implementation style:
- Keep code modular.
- Use TypeScript types.
- Keep UI components clean.
- Keep file and patch logic in separate library modules.
- Create safe defaults.
- Add useful empty states and warnings.
- Use mock data where needed, but structure it like real data.
