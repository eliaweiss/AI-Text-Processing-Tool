# AI Text Processing Tool

An AI-powered text processing tool using the Granite-4.0 model with WebGPU acceleration, built with Next.js 14.

## Features

- **Multiple Text Operations**: Rephrase, fix grammar, simplify, expand, and more
- **Multiple Variations**: Generate up to 5 variations of your text at once
- **WebGPU Acceleration**: Fast inference using your GPU
- **Custom Prompts**: Customize how the AI processes your text
- **Modern UI**: Clean, responsive interface built with Next.js
- **In-Browser Processing**: All processing happens locally - no data sent to servers

## Text Operations

### Basic Operations
- **Rephrase**: Make text more concise while preserving meaning
- **Fix Grammar**: Correct grammatical and punctuation errors

### Advanced Operations
- **Simplify**: Rewrite in simpler language (ELI5 style)
- **Expand**: Add more detail and context
- **Make Formal**: Convert to professional tone
- **Make Casual**: Convert to friendly, conversational tone
- **Convert to Bullets**: Transform text into bullet points
- **Convert to Paragraph**: Transform bullet points into flowing paragraphs
- **Remove Filler**: Remove unnecessary filler words

## Requirements

- Modern browser with WebGPU support (Chrome/Edge 113+)
- At least 2GB of VRAM for the model
- Internet connection (for model download on first run)
- Node.js 18+ for development

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This will start the Next.js development server at `http://localhost:3000`.

### Build for Production

```bash
npm run build
npm start
```

This creates an optimized production build and starts the server.

## How to Use

1. Open the app in your browser
2. Wait for the model to load (first time may take 2-3 minutes as the model is downloaded)
3. Enter your text in the input area
4. Select an operation from the dropdown
5. Choose the number of variations you want (1-5)
6. Click "Generate Variations" or press Ctrl/Cmd+Enter
7. Copy the variations you like!

## Architecture

- **Framework**: Next.js 14 (App Router)
- **Model**: IBM Granite-4.0 1B (ONNX format)
- **Inference Library**: @huggingface/transformers (v3.7.6+)
- **Acceleration**: WebGPU
- **Frontend**: React 18 with TypeScript

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main text processor component
│   └── globals.css         # Global styles
├── lib/
│   ├── types.ts            # TypeScript type definitions
│   └── textProcessor.ts    # Text processing logic
├── next.config.js          # Next.js configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## Browser Support

- ✅ Chrome/Chromium 113+
- ✅ Edge 113+
- ⚠️ Firefox (requires experimental WebGPU feature flag)
- ❌ Safari (WebGPU support in progress)

## Troubleshooting

### Model Loading Issues

- Ensure WebGPU is available: Open DevTools (F12) and check console for WebGPU errors
- Try Chrome/Edge if using Firefox
- Clear browser cache if model partially downloads

### Processing Issues

- Check browser console (F12) for errors
- Ensure model has finished loading
- Try with shorter text first

### Performance Issues

- Enable hardware acceleration in browser settings
- Close other GPU-intensive applications
- Reduce number of variations to generate at once

## Advanced Usage

### Custom Prompts

You can customize how the AI processes text by editing the system prompt at the bottom of the page. Use `{TEXT}` as a placeholder for the input text.

Example custom prompt:
```
Translate the following text to Spanish and make it sound poetic:

Text: {TEXT}

Translation:
```

### Keyboard Shortcuts

- **Ctrl/Cmd+Enter**: Generate variations (when focused in input textarea)

## Notes

- The model is cached in the browser's cache storage, so subsequent uses are much faster
- All processing happens locally in your browser - no data is sent to external servers
- WebGPU is required; CPU fallback is not implemented
- The app uses Next.js headers to enable WebGPU and WebAssembly features

## License

MIT
