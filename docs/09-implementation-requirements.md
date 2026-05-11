# Implementation Requirements

## Functional requirements

The app must:

- Run as a desktop app.
- Let the user create a project.
- Let the user add files to section pages.
- Let the user scan text files.
- Let the user generate AI prompts.
- Let the user call an AI API.
- Let the user review AI suggestions.
- Let the user accept or reject changes.
- Let the user export accepted changes.
- Preserve original paths.
- Generate backups.
- Generate manifest and install notes.

## Non-functional requirements

The app should be:

- Safe by default.
- Local-first.
- Clear in its warnings.
- Easy to use one section at a time.
- Able to work without direct game folder access.
- Able to continue even when AI fails.
- Able to export useful reports.

## Security requirements

- Do not expose API key in client bundles if using a public build.
- For local-only builds, store API key in local settings with clear user control.
- Do not upload files unless the user explicitly triggers an AI request.
- Show what content will be sent to AI.
- Avoid sending whole folders automatically.
- Do not send binary files to text AI by default.

## Validation requirements

- Validate AI JSON.
- Validate patch targets.
- Validate file paths.
- Validate export names.
- Validate converter paths.
- Validate output folder access.

## Performance requirements

- Large folder scans should be cancellable.
- Large file previews should not freeze the UI.
- The app should avoid loading huge files fully into the UI.
- Use snippets for AI instead of entire large files.

## Accessibility requirements

- Keyboard-accessible navigation.
- Clear labels.
- Clear status messages.
- Readable diff output.
- Avoid relying only on icons for status.
