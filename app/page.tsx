"use client";

import { useState, useEffect } from "react";
import {
  processText,
  getDefaultPromptTemplate,
  rankGenerations,
} from "@/lib/textProcessor";
import type { OperationType, AppState } from "@/lib/types";

// Model configuration
const MODEL_ID = "gpt-oss:20b";

export default function Home() {
  // State management
  const [appState, setAppState] = useState<AppState>({
    modelLoaded: true, // Ollama is always ready (no loading needed)
    isProcessing: false,
    currentOperation: "rephrase",
  });
  const [inputText, setInputText] = useState("");
  const [operation, setOperation] = useState<OperationType>("rephrase");
  const [numVariations, setNumVariations] = useState(1);
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [variations, setVariations] = useState<
    Array<{
      text: string;
      error?: boolean;
      isStreaming?: boolean;
      rank?: number;
    }>
  >([]);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "info" | "success" | "error";
  } | null>(null);
  const [isRanking, setIsRanking] = useState(false);
  const [hasRanked, setHasRanked] = useState(false);

  // Update system prompt when operation changes
  useEffect(() => {
    setSystemPrompt(getDefaultPromptTemplate(operation));

    // Auto-set target language based on operation
    if (operation === "translate-pt") {
      setTargetLanguage("Portuguese");
    } else if (operation === "translate-en") {
      setTargetLanguage("English");
    } else if (operation === "translate") {
      setTargetLanguage("English"); // Default for generic translate
    }
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
    if (appState.isProcessing) {
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
    setHasRanked(false);

    showStatus(
      `Generating ${numVariations} variation${numVariations > 1 ? "s" : ""}...`
    );

    try {
      const customPrompt = systemPrompt.trim();
      const newVariations: Array<{
        text: string;
        error?: boolean;
        isStreaming?: boolean;
      }> = [];

      // Generate variations one by one
      for (let i = 0; i < numVariations; i++) {
        showStatus(`Generating variation ${i + 1} of ${numVariations}...`);

        // Add a placeholder for the current streaming variation
        const currentIndex = i;
        newVariations.push({ text: "", isStreaming: true });
        setVariations([...newVariations]);

        const result = await processText(MODEL_ID, {
          text: trimmedInput,
          operation,
          customPrompt: customPrompt || undefined,
          seed: Math.floor(Math.random() * 1000000),
          targetLanguage: operation.startsWith("translate")
            ? targetLanguage
            : undefined,
          onStream: (partialText: string) => {
            // Update the streaming variation in real-time
            newVariations[currentIndex] = {
              text: partialText,
              isStreaming: true,
            };
            setVariations([...newVariations]);
          },
        });

        if (result.success && result.processedText) {
          newVariations[currentIndex] = {
            text: result.processedText,
            isStreaming: false,
          };
        } else {
          console.error("Generation failed:", result.error);
          const errorMessage = result.error || "Failed to generate";
          newVariations[currentIndex] = {
            text: errorMessage,
            error: true,
            isStreaming: false,
          };
          // Also show error in status
          showError(errorMessage);
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

  // Handle ranking
  const handleRank = async () => {
    if (isRanking || hasRanked) {
      return;
    }

    const successfulGenerations = variations.filter((v) => !v.error);
    if (successfulGenerations.length < 2) {
      showError("Need at least 2 successful generations to rank");
      return;
    }

    setIsRanking(true);
    showStatus("Ranking generations...");

    try {
      const customPrompt = systemPrompt.trim();
      const rankingResult = await rankGenerations(MODEL_ID, {
        task: customPrompt || getDefaultPromptTemplate(operation),
        generations: successfulGenerations.map((v) => v.text),
      });

      if (rankingResult.success && rankingResult.ranking) {
        // Reorder variations based on ranking
        const rankedVariations = rankingResult.ranking.map(
          (originalIndex, newRank) => ({
            ...successfulGenerations[originalIndex],
            rank: newRank + 1, // 1-indexed rank for display
          })
        );

        setVariations(rankedVariations);
        setHasRanked(true);
        showSuccess("Ranking complete!");
      } else {
        showError(rankingResult.error || "Ranking failed");
      }
    } catch (error) {
      console.error("Ranking error:", error);
      showError("An error occurred during ranking");
    } finally {
      setIsRanking(false);
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
      <div
        style={{
          textAlign: "center",
          marginTop: "-10px",
          marginBottom: "20px",
          color: "#666",
          fontSize: "14px",
        }}
      >
        Using model: <strong>{MODEL_ID}</strong>
      </div>

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
            <option value="translate">Translate (Custom Language)</option>
            <option value="translate-pt">Target lang PT</option>
            <option value="translate-en">Target lang EN</option>
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

        {operation.startsWith("translate") && (
          <>
            <label htmlFor="language-input">Target Language:</label>
            <input
              type="text"
              id="language-input"
              placeholder="e.g., English, Spanish, French..."
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              disabled={
                appState.isProcessing ||
                operation === "translate-pt" ||
                operation === "translate-en"
              }
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

        <button onClick={handleSubmit} disabled={appState.isProcessing}>
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3>Generated Variations</h3>
            {variations.length > 1 &&
              !appState.isProcessing &&
              variations.some((v) => !v.error) && (
                <button
                  onClick={handleRank}
                  disabled={isRanking || hasRanked}
                  className="secondary-btn"
                  style={{ marginLeft: "auto" }}
                >
                  {isRanking
                    ? "Ranking..."
                    : hasRanked
                    ? "✓ Ranked"
                    : "🏆 Rank Variations"}
                </button>
              )}
          </div>
          {statusMessage && (
            <div className={`status-message visible ${statusMessage.type}`}>
              {statusMessage.text}
            </div>
          )}
          <div className="variations-container">
            {variations.map((variation, index) => (
              <div
                key={index}
                className={`variation-card ${variation.error ? "error" : ""} ${
                  variation.isStreaming ? "streaming" : ""
                }`}
              >
                <div className="variation-header">
                  <span className="variation-label">
                    {variation.rank !== undefined
                      ? `#${variation.rank}`
                      : `Variation ${index + 1}`}
                    {variation.isStreaming && (
                      <span className="streaming-indicator"> ⟳</span>
                    )}
                  </span>
                  {!variation.error && !variation.isStreaming && (
                    <button
                      className="copy-variation-btn"
                      onClick={() => handleCopy(variation.text, index)}
                    >
                      📋 Copy
                    </button>
                  )}
                </div>
                <div className="variation-content">
                  {variation.text ||
                    (variation.isStreaming ? "Generating..." : "")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
