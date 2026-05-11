# Phase 4 Prompt: AI Integration

Add AI prompt generation and OpenRouter-compatible chat completion support.

Requirements:
- Add settings fields for API key and model name.
- Store API key locally with clear user control.
- Build `promptBuilder.ts`.
- Build `openrouterClient.ts` or generic AI client.
- Show prompt preview before sending.
- Send only selected snippets or relevant scanned sections.
- Ask the AI to return structured JSON.
- Parse AI response.
- Validate against AI patch response schema.
- Save AI request and response in project state.
- Show errors for invalid JSON or failed API call.

Do not auto-apply AI changes.
Do not send whole folders automatically.

Deliver:
- AI settings UI
- Prompt preview UI
- AI response UI
- Structured response parser
- Good error states
