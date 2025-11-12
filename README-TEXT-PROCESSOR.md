# AI Text Processing Tool

A TypeScript-based text processing tool that uses in-browser LLM (Granite-4.0) with WebGPU to test AI capabilities for practical text manipulation tasks.

## Purpose

This project tests whether in-browser Large Language Models can effectively handle real-world text processing tasks such as:
- **Rephrasing**: Making text more concise while preserving meaning
- **Grammar Fixing**: Correcting grammatical and punctuation errors

## Features

- **Nine Text Processing Operations**:
  - **Basic Operations**:
    - Rephrase text to be more concise
    - Fix grammar and punctuation errors
  - **Advanced Operations** (toggle to reveal):
    - Simplify text (ELI5 - Explain Like I'm 5)
    - Expand and elaborate on text
    - Convert to formal tone
    - Convert to casual tone
    - Convert to bullet points
    - Convert to paragraph
    - Remove filler words
- **Multiple Variations**: Generate 1-5 variations with different seeds to see different options
- **Customizable System Prompts**: Edit the system prompt to customize how the AI processes text
- **Copy to Clipboard**: Easily copy any generated variation with one click
- **In-Browser Processing**: All text processing happens locally using WebGPU
- **TypeScript**: Type-safe implementation for better development experience
- **Modern UI**: Clean, light-themed interface with responsive design
- **Privacy-First**: No data sent to external servers

## Requirements

- Node.js (npm) installed
- Modern browser with WebGPU support:
  - Chrome/Edge 113+
  - Firefox with experimental WebGPU features enabled
- At least 2GB of VRAM for the model
- Internet connection (for model download on first run)

## Installation

```bash
npm install
```

This will install all dependencies including TypeScript and the Hugging Face Transformers library.

## Running the Application

### Development Mode

```bash
npm run dev:text
```

This will start the Vite dev server and automatically open the text processor in your browser at `http://localhost:5173/index-text.html`.

### Build for Production

```bash
npm run build:text
```

This creates an optimized bundle in the `dist-text/` folder.

### Preview Production Build

```bash
npm run preview:text
```

## How to Use

1. **Wait for Model to Load**: On first run, the model will download (2-3 minutes). Subsequent runs are much faster due to browser caching.

2. **Enter Your Text**: Type or paste text into the "Input Text" textarea.

3. **Select Operation**:
   - Start with basic operations: "Rephrase" or "Fix Grammar & Punctuation"
   - Check **"Advanced Options"** to reveal 7 additional operations:
     - Simplify (ELI5)
     - Expand & Elaborate
     - Make Formal
     - Make Casual
     - Convert to Bullet Points
     - Convert to Paragraph
     - Remove Filler Words

4. **Set Number of Variations**: Choose how many variations you want to generate (1-5, default is 2).

5. **Customize System Prompt (Optional)**: 
   - Edit the system prompt at the bottom to change how the AI processes text
   - Use `{TEXT}` as a placeholder for the input text
   - Click "Reset to Default" to restore the default prompt
   - The prompt automatically updates when you change the operation

6. **Generate**: Click the "Generate Variations" button or press `Ctrl/Cmd + Enter`.

7. **View Results**: Multiple variations will appear on the right side, generated one by one.

8. **Copy Results**: Click the "📋 Copy" button on any variation card to copy that specific text.

## Technical Stack

- **Language**: TypeScript
- **Model**: IBM Granite-4.0 1B (ONNX format)
- **Inference**: @huggingface/transformers v3.7.6+
- **Bundler**: Vite
- **Acceleration**: WebGPU
- **Frontend**: Vanilla TypeScript with minimal dependencies

## Project Structure

```
/Users/eliaweiss/work/AI-Code-Assistant/
├── index-text.html              # HTML entry point
├── src/
│   ├── main.ts                  # Main application logic
│   ├── textProcessor.ts         # Text processing with prompts
│   ├── types.ts                 # TypeScript type definitions
│   └── styles/
│       └── text-processor.css   # Styling
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

## Browser Support

- ✅ Chrome/Chromium 113+
- ✅ Edge 113+
- ⚠️ Firefox (requires experimental WebGPU feature flag)
- ❌ Safari (WebGPU support in progress)

## Troubleshooting

### Model Loading Issues

- **WebGPU not available**: Check browser console (F12) for WebGPU errors. Try Chrome or Edge.
- **Partial download**: Clear browser cache and refresh.
- **Out of memory**: Close other applications and browser tabs.

### Processing Issues

- **No output**: Check browser console for errors. Ensure model has finished loading.
- **Poor results**: The Granite-4.0 model is code-focused; results on general text may vary. Consider trying different prompts or a text-focused model.
- **Slow processing**: Normal on first inference. Subsequent processing is faster.

### Performance

- Enable hardware acceleration in browser settings
- Close other GPU-intensive applications
- Reduce browser window size if needed

## Model Performance

The current implementation uses Granite-4.0 1B, which is primarily designed for code completion. Performance on general text tasks may vary:

- **Expected**: Reasonable grammar fixes and simple rephrasing
- **Limitations**: May not match specialized text models for complex rephrasing

If results are unsatisfactory, consider switching to a text-focused model like:
- Phi-3-mini
- SmolLM
- Other small text-focused models available in ONNX format

## How Variations Work

The application generates multiple variations by slightly adjusting the model's temperature parameter for each generation. This creates diverse outputs while maintaining quality:

- **Variation 1**: Uses temperature 0.6
- **Variation 2**: Uses temperature 0.65
- **Variation 3**: Uses temperature 0.7
- And so on...

Each variation is generated sequentially, and you can see them appear one by one. This allows you to:
- Compare different phrasings
- Choose the best output for your needs
- See the model's creativity range

## Tips for Custom Prompts

You can experiment with different system prompts to improve results. Here are some examples:

**Example 1: Professional tone**
```
Rewrite the following text in a professional and formal tone. Only output the rewritten text.

Text: {TEXT}

Result:
```

**Example 2: Simplification**
```
Simplify the following text to make it easier to understand. Use simpler words and shorter sentences. Only output the simplified text.

Text: {TEXT}

Result:
```

**Example 3: Technical writing**
```
Rewrite the following text for technical documentation. Be precise, clear, and concise. Only output the rewritten text.

Text: {TEXT}

Result:
```

Remember to always include `{TEXT}` as a placeholder where you want the input text to be inserted.

## Privacy & Security

- All processing happens in your browser
- No data is sent to external servers
- Model is cached locally in browser storage
- Network access only needed for initial model download

## Notes

- Model caching means first run is slow, but subsequent uses are much faster
- WebGPU is required - no CPU fallback implemented
- TypeScript provides better type safety and development experience
- The original JavaScript code assistant (`index.html`) remains unchanged

## Original Code Assistant

To run the original code completion assistant, use:

```bash
npm run dev
```

## License

MIT

