# Security Notes

- Redux AI Assistant works on project-local workspace copies.
- Original imported files are not modified.
- `.rpf` archives are read-only; app does not repack or edit archives.
- Export packages are manual install folders. No game install is performed.
- OpenRouter receives only prompts/snippets the user sends.
- API keys are not written to app logs.
- Local ComfyUI image generation stays local to the configured ComfyUI server.
- DDS files are not edited by AI directly; PNG previews are edited, then user may compile DDS after review.
- Backups are created before workspace patch writes.
