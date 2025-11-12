<!-- c1208d23-cf77-4b6c-af5f-a8c6d8b4729d f7df3e5a-25f8-48b4-ae6d-c550447b6550 -->
# Create New TypeScript Text Processing Tool

## Overview

Build a completely new TypeScript implementation for text processing (rephrase and grammar fixing) using in-browser LLM with WebGPU, while keeping the existing JavaScript code untouched.

## Implementation Steps

### 1. TypeScript Configuration

- Create `tsconfig.json` with proper ES module settings, DOM types, and target ES2020+
- Update `package.json` to add TypeScript as a dev dependency
- Vite already supports TypeScript out of the box, so existing [`vite.config.js`](vite.config.js) should work

### 2. Create New HTML Entry Point

- Create new `index-text.html` (or similar) with:
  - Two textareas: input (editable) and output (read-only)
  - Dropdown menu with "Rephrase" and "Fix Grammar/Punctuation" options
  - Submit button
  - Loading indicator
  - Modern dark theme styling
- Link to new TypeScript main file (`main.ts`)

### 3. Create TypeScript Application Files

**`src/main.ts`** - Main application logic:

- Import Hugging Face transformers library with proper types
- Initialize Granite-4.0 1B model with WebGPU
- Handle model loading with loading indicator
- Implement text processing with two operation modes
- Handle form submission and display results

**`src/textProcessor.ts`** - Text processing logic:

- Define `OperationType` enum/type: "rephrase" | "grammar"
- Create prompt templates for each operation:
  - **Rephrase**: "Rewrite the following text to be more concise while preserving its meaning"
  - **Grammar**: "Fix only the grammatical and punctuation errors in the following text"
- Export `processText()` function that takes input and operation type
- Handle model inference and return processed text

**`src/types.ts`** - TypeScript type definitions:

- Model and tokenizer types (if not provided by @huggingface/transformers)
- Application state types
- Operation types

### 4. Create Dedicated Stylesheet

- Create `src/styles/text-processor.css` with:
  - Two-column or stacked layout for input/output textareas
  - Dropdown styling with modern look
  - Submit button with hover/active states
  - Loading indicator animation
  - Dark theme consistent with original
  - Responsive design

### 5. Update Configuration Files

- Update `package.json` scripts to add:
  - `"dev:text"`: Vite dev server pointing to new HTML
  - `"build:text"`: Build command for new app
- Add TypeScript to devDependencies
- Keep existing scripts for original code assistant

### 6. Create README for New Tool

- Create `README-TEXT-PROCESSOR.md` documenting:
  - Purpose: Testing in-browser LLM for text manipulation
  - Installation steps
  - How to run (`npm run dev:text`)
  - Usage instructions (dropdown selection + submit)
  - Technical stack (TypeScript, Vite, Granite-4.0, WebGPU)

## File Structure

```
/Users/eliaweiss/work/AI-Code-Assistant/
├── index.html (existing code assistant)
├── index-text.html (NEW - text processor)
├── main.js (existing)
├── src/
│   ├── main.ts (NEW)
│   ├── textProcessor.ts (NEW)
│   ├── types.ts (NEW)
│   └── styles/
│       ├── main.css (existing)
│       └── text-processor.css (NEW)
├── tsconfig.json (NEW)
├── package.json (UPDATE)
├── README.md (existing)
└── README-TEXT-PROCESSOR.md (NEW)
```

## Notes

- Existing JavaScript code assistant remains fully functional
- TypeScript provides better type safety and IDE support
- Can run both apps independently with different npm scripts
- If Granite-4.0 model performs poorly on text tasks, we can easily swap models later

### To-dos

- [ ] Update index.html with two textboxes, dropdown menu, and submit button
- [ ] Rewrite main.js to replace autocomplete with on-demand text processing and create prompts for rephrase and grammar fixing
- [ ] Update styles.css for new two-textbox layout, dropdown, and button styling
- [ ] Remove unused files: suggestionUI.js and cleanSuggestion.js
- [ ] Update README.md to reflect text processing tool purpose and usage