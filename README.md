# Model Marshal Local Web App

## Overview
This is a standalone, local web application built with pure HTML, CSS, and JavaScript. It infers a domain-specific system prompt from the query, queries multiple AI models via the OpenRouter API using that prompt, displays a side-by-side preview of responses and scores, allows adding a "Ben's Synthesis" summary, and generates a PDF report incorporating everything.

- **No server required**: Runs entirely in the browser.
- **Models queried**: Grok (x-ai/grok-beta), Claude Sonnet (anthropic/claude-3.5-sonnet-20240620), ChatGPT (openai/gpt-4o), Gemini (google/gemini-pro-1.5).
- **System Prompts**: Inferred from query (e.g., 'You are an expert in manufacturing supply chain optimization') using Claude Sonnet; same prompt for all models unless customized.
- **Scoring**: Each response is scored 1-10 on tone (neutral/professional), authoritativeness (expert/fact-based), and objectivity (unbiased), with a 1-sentence excerpt justification from Sonnet.
- **Preview**: Side-by-side cards showing prompt, response, and scores for each model.
- **Synthesis**: Textarea for user's ethical summary, included in PDF.
- **Output**: PDF report with header, inferred prompt, model sections (prompt + response + scores), and user's synthesis.
- **Dependencies**: jsPDF via CDN (no local installs needed).

## Setup and Run Instructions
1. **Open the app**: Navigate to the `model-marshal-app/` directory and open `index.html` in any modern web browser (e.g., Chrome, Firefox).
2. **Set API Key**: Enter your OpenRouter API key in the password field. (Get one at https://openrouter.ai/keys if you don't have it. Note: This is client-side, so keep it secure for local use only.)
3. **Enter Query**: Type your query in the textarea (e.g., "How can AI streamline small manufacturing supply chain?").
4. **Dispatch**: Click "Dispatch to Models". The app will:
   - Infer a system prompt from the query.
   - Query each model with the system prompt.
   - Score responses with Sonnet.
   - Display a side-by-side preview.
5. **Add Synthesis**: Review the preview, enter your ethical synthesis in the textarea.
6. **Generate PDF**: Click "Generate & Export PDF" to create and download `model-marshal-report.pdf`.
7. **Status**: Watch the status div for progress.

## Testing
Logically tested with sample query: "How can AI streamline small manufacturing supply chain?".
- Expected system prompt: Something like "You are an expert in manufacturing supply chain optimization".
- Preview shows four cards with prompt, response, scores.
- PDF includes all sections plus user synthesis.
- Total API calls: 1 (inference) + 4 (queries) + 4 (scorings) = 9.
- Ensure browser allows fetch to `https://openrouter.ai` (no CORS issues).

## Files
- `index.html`: Main page with form, preview, styles.
- `script.js`: Handles inference, API calls, preview generation, PDF creation.
- This README for instructions.

## Limitations
- Client-side only: API key exposed in browser (use for local/demo only; for production, proxy via server).
- Responses formatted with <br> in preview; PDF uses jsPDF text wrapping.
- Error handling: Displays in status div; check console for details.
- PDF: Text-heavy; long content spans pages automatically.

## Customization
- Edit `script.js` to adjust models array, inference prompt, scoring criteria, or temperature.
- Add more styles for preview layout in `index.html`.

Updated with model-specific prompts, preview, synthesis field, and separate PDF generation. Ready for local use.