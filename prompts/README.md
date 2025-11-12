# Prompt Templates

This directory contains the prompt templates used by the text processor. Each markdown file corresponds to a specific operation type.

## Available Prompts

- **`rephrase.md`** - Prompt for rephrasing text to be more concise
- **`grammar.md`** - Prompt for fixing grammar and punctuation errors
- **`translate.md`** - Prompt for translating text between languages
- **`default.md`** - Default prompt for generic text processing

## Editing Prompts

You can edit these markdown files directly to customize the prompts. The following placeholders are available:

- `{TEXT}` - Will be replaced with the user's input text
- `{LANGUAGE}` - Will be replaced with the target language (used in translation)

## Notes

- Make sure to keep the placeholder syntax exactly as `{TEXT}` and `{LANGUAGE}` (case-sensitive)
- The prompts are imported as raw strings into the TypeScript code
- After editing, restart the development server for changes to take effect

