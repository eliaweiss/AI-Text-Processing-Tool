<!-- c968bf2e-f70d-4101-9346-eb452bcdfd3a b10ad00c-64d4-4578-9293-43e8ccaa7682 -->
# Migrate from Transformers to Ollama API

## Overview

Replace the browser-based Hugging Face Transformers implementation with API calls to a local Ollama server running the `phi4-mini:3.8b` model.

## Key Changes

### 1. Update Dependencies

- **[package.json](package.json)**: Remove `@huggingface/transformers` dependency
- No new dependencies needed (using native `fetch` API)

### 2. Update Text Processor Logic

- **[lib/textProcessor.ts](lib/textProcessor.ts)**: 
- Remove all Transformers imports (`TextStreamer`, etc.)
- Replace `processText()` to call Ollama's `/api/generate` endpoint at `http://localhost:11434`
- Handle streaming responses (Ollama returns newline-delimited JSON)
- Replace `rankGenerations()` to use Ollama API
- Keep existing prompt template logic and `cleanResponse()` function unchanged

### 3. Simplify UI Component

- **[app/page.tsx](app/page.tsx)**:
- Remove model/tokenizer loading logic (lines 45-92)
- Remove `AutoModelForCausalLM`, `AutoTokenizer`, `env` imports
- Remove refs for model and tokenizer
- Update `MODEL_ID` to `"phi4-mini:3.8b"`
- Simplify state to remove `modelLoaded` (Ollama is always "ready")
- Update `handleSubmit()` to pass prompts directly without model/tokenizer
- Remove loading spinner during app startup

### 4. API Integration Details

**Ollama API Format:**

- Endpoint: `POST http://localhost:11434/api/generate`
- Request: `{ model: "phi4-mini:3.8b", prompt: "...", stream: true }`
- Response (streaming): Newline-delimited JSON objects, each with `response` field
- Error handling: Show helpful messages if Ollama isn't running

### 5. Maintain Existing Features

- Keep all prompt templates in `prompts/` directory unchanged
- Maintain streaming UI feedback during generation
- Preserve ranking functionality
- Keep all operation types (rephrase, grammar, translate)

### To-dos

- [ ] Remove @huggingface/transformers dependency from package.json
- [ ] Rewrite processText() and rankGenerations() in lib/textProcessor.ts to use Ollama API with streaming support
- [ ] Remove model loading logic from app/page.tsx and update to work with Ollama API
- [ ] Test all operations (rephrase, grammar, translate) with multiple variations and ranking