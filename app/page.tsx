"use client";

import { useState, useEffect, useRef } from "react";
import {
  AutoModelForCausalLM,
  AutoTokenizer,
  env,
} from "@huggingface/transformers";
import { processText, getDefaultPromptTemplate } from "@/lib/textProcessor";
import type { OperationType, AppState } from "@/lib/types";

// Model configuration
const MODEL_ID = "onnx-community/granite-4.0-1b-ONNX-web";

export default function Home() {
  // State management
  const [appState, setAppState] = useState<AppState>({
    modelLoaded: false,
    isProcessing: false,
    currentOperation: "rephrase",
  });
  const [inputText, setInputText] = useState("");
  const [operation, setOperation] = useState<OperationType>("rephrase");
  const [numVariations, setNumVariations] = useState(2);
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [variations, setVariations] = useState<
    Array<{ text: string; error?: boolean }>
  >([]);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "info" | "success" | "error";
  } | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Refs for model and tokenizer
  const modelRef = useRef<any>(null);
  const tokenizerRef = useRef<any>(null);

  // Initialize model on component mount
  useEffect(() => {
    async function initializeModel() {
      try {
        console.log("Configuring environment...");
        // Configure environment
        env.backends.onnx.wasm.numThreads = navigator.hardwareConcurrency ?? 4;
        env.useBrowserCache = true;
        env.allowRemoteModels = true;

        console.log("Loading model...");
        setLoadingMessage(
          "Loading model... This may take 2-3 minutes on first run."
        );

        tokenizerRef.current = await AutoTokenizer.from_pretrained(MODEL_ID);
        console.log("Tokenizer loaded");

        modelRef.current = await AutoModelForCausalLM.from_pretrained(
          MODEL_ID,
          {
            dtype: "q4",
            device: "webgpu",
          }
        );
        console.log("Model loaded");

        setAppState((prev) => ({ ...prev, modelLoaded: true }));
        setLoadingMessage("");
        showSuccess("Model loaded successfully! Ready to process text.");
      } catch (error) {
        console.error("Error loading model:", error);
        setLoadingMessage("");
        showError(
          "Failed to load model. Please ensure WebGPU is supported in your browser."
        );
      }
    }

    initializeModel();
  }, []);

  // Update system prompt when operation changes
  useEffect(() => {
    setSystemPrompt(getDefaultPromptTemplate(operation));
  }, [operation]);

  // Status message functions
  const showStatus = (text: string) => {
    setStatusMessage({ text, type: "info" });
  };

  const showSuccess = (text: string) => {
    setStatusMessage({ text, type: "success" });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const showError = (text: string) => {
    setStatusMessage({ text, type: "error" });
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!appState.modelLoaded || appState.isProcessing) {
      return;
    }

    const trimmedInput = inputText.trim();
    if (!trimmedInput) {
      showError("Please enter some text to process");
      return;
    }

    if (numVariations < 1 || numVariations > 5) {
      showError("Please enter a number between 1 and 5");
      return;
    }

    setAppState((prev) => ({ ...prev, isProcessing: true }));
    setVariations([]);

    showStatus(
      `Generating ${numVariations} variation${numVariations > 1 ? "s" : ""}...`
    );

    try {
      const customPrompt = systemPrompt.trim();
      const newVariations: Array<{ text: string; error?: boolean }> = [];

      // Generate variations one by one
      for (let i = 0; i < numVariations; i++) {
        showStatus(`Generating variation ${i + 1} of ${numVariations}...`);

        const result = await processText(
          modelRef.current,
          tokenizerRef.current,
          {
            text: trimmedInput,
            operation,
            customPrompt: customPrompt || undefined,
            seed: i,
            targetLanguage:
              operation === "translate" ? targetLanguage : undefined,
          }
        );

        if (result.success && result.processedText) {
          newVariations.push({ text: result.processedText });
        } else {
          newVariations.push({
            text: result.error || "Failed to generate",
            error: true,
          });
        }

        setVariations([...newVariations]);
      }

      showSuccess(
        `Generated ${numVariations} variation${
          numVariations > 1 ? "s" : ""
        } successfully!`
      );
    } catch (error) {
      console.error("Processing error:", error);
      showError("An error occurred during processing");
    } finally {
      setAppState((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  // Handle copy to clipboard
  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a temporary "Copied!" indicator here
    } catch (error) {
      console.error("Failed to copy:", error);
      showError("Failed to copy text to clipboard");
    }
  };

  // Handle reset prompt
  const handleResetPrompt = () => {
    setSystemPrompt(getDefaultPromptTemplate(operation));
    showSuccess("System prompt reset to default");
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="container">
      <h1>AI Text Processing Tool</h1>

      {loadingMessage && (
        <div className="loading-indicator">
          <span className="spinner">⟳</span> {loadingMessage}
        </div>
      )}

      <div className="controls">
        <label htmlFor="operation-select">Operation:</label>
        <select
          id="operation-select"
          value={operation}
          onChange={(e) => setOperation(e.target.value as OperationType)}
          disabled={appState.isProcessing}
        >
          <optgroup label="Basic Operations">
            <option value="rephrase">Rephrase (Make Concise)</option>
            <option value="grammar">Fix Grammar & Punctuation</option>
          </optgroup>
          <optgroup label="Translation">
            <option value="translate">Translate</option>
          </optgroup>
          {/* 
          <optgroup label="Clarity & Style">
            <option value="simplify">Simplify (ELI5)</option>
            <option value="expand">Expand & Elaborate</option>
          </optgroup>

          <optgroup label="Tone Conversion">
            <option value="formal">Make Formal</option>
            <option value="casual">Make Casual</option>
          </optgroup>

          <optgroup label="Format Conversion">
            <option value="to-bullets">Convert to Bullet Points</option>
            <option value="to-paragraph">Convert to Paragraph</option>
          </optgroup>

          <optgroup label="Cleanup">
            <option value="remove-filler">Remove Filler Words</option>
          </optgroup> */}
        </select>

        {operation === "translate" && (
          <>
            <label htmlFor="language-input">Target Language:</label>
            <input
              type="text"
              id="language-input"
              placeholder="e.g., English, Spanish, French..."
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              disabled={appState.isProcessing}
            />
          </>
        )}

        <label htmlFor="variations-input">Variations:</label>
        <input
          type="number"
          id="variations-input"
          min="1"
          max="5"
          value={numVariations}
          onChange={(e) => setNumVariations(parseInt(e.target.value) || 2)}
          disabled={appState.isProcessing}
        />

        <button
          onClick={handleSubmit}
          disabled={!appState.modelLoaded || appState.isProcessing}
        >
          Generate Variations
        </button>
      </div>

      <div className="main-layout">
        <div className="input-section">
          <label htmlFor="input-text">Input Text</label>
          <textarea
            id="input-text"
            placeholder="Enter your text here..."
            rows={12}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={appState.isProcessing}
          />
        </div>

        <div className="variations-section">
          <h3>Generated Variations</h3>
          <div className="variations-container">
            {variations.map((variation, index) => (
              <div
                key={index}
                className={`variation-card ${variation.error ? "error" : ""}`}
              >
                <div className="variation-header">
                  <span className="variation-label">Variation {index + 1}</span>
                  {!variation.error && (
                    <button
                      className="copy-variation-btn"
                      onClick={() => handleCopy(variation.text, index)}
                    >
                      📋 Copy
                    </button>
                  )}
                </div>
                <div className="variation-content">{variation.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className={`status-message visible ${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}

      <div className="prompt-editor">
        <div className="prompt-header">
          <label htmlFor="system-prompt">
            System Prompt (Customize how the AI processes text)
          </label>
          <button
            className="secondary-btn"
            onClick={handleResetPrompt}
            disabled={appState.isProcessing}
          >
            Reset to Default
          </button>
        </div>
        <textarea
          id="system-prompt"
          placeholder="Enter custom system prompt..."
          rows={4}
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          disabled={appState.isProcessing}
        />
      </div>
    </div>
  );
}
