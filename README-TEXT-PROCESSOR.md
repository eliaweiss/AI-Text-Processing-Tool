# AI Text Processing Tool

A TypeScript-based text processing tool that uses in-browser LLM (Granite-4.0) with WebGPU to test AI capabilities for practical text manipulation tasks.

## Purpose

This project tests whether in-browser Large Language Models can effectively handle real-world text processing tasks such as:
- **Rephrasing**: Making text more concise while preserving meaning
- **Grammar Fixing**: Correcting grammatical and punctuation errors

## Features

- **Two Text Processing Operations**:
  - Rephrase text to be more concise
  - Fix grammar and punctuation errors
- **In-Browser Processing**: All text processing happens locally using WebGPU
- **TypeScript**: Type-safe implementation for better development experience
- **Modern UI**: Clean, dark-themed interface with responsive design
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
   - Choose "Rephrase (Make Concise)" to make text more concise
   - Choose "Fix Grammar & Punctuation" to correct errors

4. **Process**: Click the "Process Text" button or press `Ctrl/Cmd + Enter`.

5. **View Results**: The processed text will appear in the "Result" textarea.

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

