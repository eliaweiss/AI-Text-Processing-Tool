/**
 * Type definitions for the text processing application
 */

// Operation types that can be performed on text
export type OperationType =
  | "rephrase"
  | "grammar"
  | "simplify"
  | "expand"
  | "formal"
  | "casual"
  | "to-bullets"
  | "to-paragraph"
  | "remove-filler"
  | "translate"
  | "translate-pt"
  | "translate-en";

// Application state
export interface AppState {
  modelLoaded: boolean;
  isProcessing: boolean;
  currentOperation: OperationType;
}

// Text processing request
export interface ProcessRequest {
  text: string;
  operation: OperationType;
  customPrompt?: string;
  seed?: number;
  targetLanguage?: string;
  onStream?: (partialText: string) => void;
}

// Text processing result
export interface ProcessResult {
  success: boolean;
  processedText?: string;
  error?: string;
}

// Model configuration
export interface ModelConfig {
  modelId: string;
  dtype: string;
  device: string;
}
