# Phase 2 Prompt: Project State and Local Storage

Add local project state to Redux AI Assistant.

Requirements:
- Create TypeScript types for project, section, file, AI request, AI response, patch, texture item, and export manifest.
- Implement create project.
- Implement open/load project from local JSON.
- Implement save project to local JSON.
- Implement update section goal.
- Implement add/remove mock file references to sections.
- Implement project notes.
- Add unsaved changes indicator.
- Add basic error states.

Do not implement real AI calls yet.
Do not implement real patching yet.
Do not modify original files.

Deliver:
- Types in `src/types`.
- Project store in `src/lib/projectStore.ts`.
- UI wired to real project state.
- Example saved project JSON.
