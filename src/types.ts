/**
 * Type definitions for the text processing application
 */

// Operation types that can be performed on text
export type OperationType = 'rephrase' | 'grammar';

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

