/**
 * Main application file for AI Text Processing Tool
 */

import {
  AutoModelForCausalLM,
  AutoTokenizer,
  env,
} from '@huggingface/transformers';
import { processText, getOperationDescription, getDefaultPromptTemplate } from './textProcessor';
import type { OperationType, AppState } from './types';

// Model configuration
const MODEL_ID = 'onnx-community/granite-4.0-1b-ONNX-web';

// Configure environment
env.backends.onnx.wasm.numThreads = navigator.hardwareConcurrency ?? 4;
env.useBrowserCache = true;
env.allowRemoteModels = true;

// Application state
const appState: AppState = {
  modelLoaded: false,
  isProcessing: false,
  currentOperation: 'rephrase'
};

// Model and tokenizer
let model: any = null;
let tokenizer: any = null;

// DOM elements
const loadingIndicator = document.getElementById('loading-indicator') as HTMLDivElement;
const inputTextarea = document.getElementById('input-text') as HTMLTextAreaElement;
const outputTextarea = document.getElementById('output-text') as HTMLTextAreaElement;
const operationSelect = document.getElementById('operation-select') as HTMLSelectElement;
const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
const statusMessage = document.getElementById('status-message') as HTMLDivElement;
const systemPromptTextarea = document.getElementById('system-prompt') as HTMLTextAreaElement;
const resetPromptBtn = document.getElementById('reset-prompt-btn') as HTMLButtonElement;
const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;

/**
 * Load the model and tokenizer
 */
async function loadModel(): Promise<boolean> {
  try {
    console.log('Loading model...');
    showLoading('Loading model... This may take 2-3 minutes on first run.');
    
    tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID);
    console.log('Tokenizer loaded');
    
    model = await AutoModelForCausalLM.from_pretrained(MODEL_ID, {
      dtype: 'q4',
      device: 'webgpu',
    });
    console.log('Model loaded');
    
    appState.modelLoaded = true;
    return true;
  } catch (error) {
    console.error('Error loading model:', error);
    showError('Failed to load model. Please ensure WebGPU is supported in your browser.');
    return false;
  }
}

/**
 * Handle text processing when submit button is clicked
 */
async function handleSubmit(): Promise<void> {
  if (!appState.modelLoaded || appState.isProcessing) {
    return;
  }

  const inputText = inputTextarea.value.trim();
  if (!inputText) {
    showError('Please enter some text to process');
    return;
  }

  appState.isProcessing = true;
  submitBtn.disabled = true;
  outputTextarea.value = '';
  
  const operation = operationSelect.value as OperationType;
  appState.currentOperation = operation;
  
  showStatus(getOperationDescription(operation));

  try {
    const customPrompt = systemPromptTextarea.value.trim();
    
    const result = await processText(model, tokenizer, {
      text: inputText,
      operation,
      customPrompt: customPrompt || undefined
    });

    if (result.success && result.processedText) {
      outputTextarea.value = result.processedText;
      copyBtn.style.display = 'inline-block';
      showSuccess('Processing complete!');
    } else {
      showError(result.error || 'Processing failed');
    }
  } catch (error) {
    console.error('Processing error:', error);
    showError('An error occurred during processing');
  } finally {
    appState.isProcessing = false;
    submitBtn.disabled = false;
  }
}

/**
 * Show loading indicator with message
 */
function showLoading(message: string): void {
  loadingIndicator.style.display = 'flex';
  loadingIndicator.innerHTML = `<span class="spinner">⟳</span> ${message}`;
}

/**
 * Hide loading indicator
 */
function hideLoading(): void {
  loadingIndicator.style.display = 'none';
}

/**
 * Show status message
 */
function showStatus(message: string): void {
  statusMessage.textContent = message;
  statusMessage.className = 'status-message info';
  statusMessage.style.display = 'block';
}

/**
 * Show success message
 */
function showSuccess(message: string): void {
  statusMessage.textContent = message;
  statusMessage.className = 'status-message success';
  statusMessage.style.display = 'block';
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    statusMessage.style.display = 'none';
  }, 3000);
}

/**
 * Show error message
 */
function showError(message: string): void {
  statusMessage.textContent = message;
  statusMessage.className = 'status-message error';
  statusMessage.style.display = 'block';
}

/**
 * Update system prompt to default for selected operation
 */
function updateSystemPrompt(): void {
  const operation = operationSelect.value as OperationType;
  systemPromptTextarea.value = getDefaultPromptTemplate(operation);
}

/**
 * Reset system prompt to default
 */
function resetSystemPrompt(): void {
  updateSystemPrompt();
  showSuccess('System prompt reset to default');
}

/**
 * Copy output text to clipboard
 */
async function copyToClipboard(): Promise<void> {
  const text = outputTextarea.value;
  
  if (!text) {
    showError('No text to copy');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    
    // Update button text temporarily
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✓ Copied!';
    copyBtn.style.backgroundColor = '#4caf50';
    
    showSuccess('Text copied to clipboard!');
    
    // Reset button after 2 seconds
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.backgroundColor = '';
    }, 2000);
  } catch (error) {
    console.error('Failed to copy:', error);
    showError('Failed to copy text to clipboard');
  }
}

/**
 * Initialize the application
 */
async function initializeApp(): Promise<void> {
  console.log('Initializing application...');
  
  // Set initial system prompt
  updateSystemPrompt();
  
  const success = await loadModel();
  hideLoading();

  if (success) {
    submitBtn.disabled = false;
    showSuccess('Model loaded successfully! Ready to process text.');
    
    // Set up event listeners
    submitBtn.addEventListener('click', handleSubmit);
    resetPromptBtn.addEventListener('click', resetSystemPrompt);
    copyBtn.addEventListener('click', copyToClipboard);
    
    // Allow Enter key in textarea (with Shift) and submit with Ctrl/Cmd+Enter
    inputTextarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
    });
    
    // Update operation and system prompt when dropdown changes
    operationSelect.addEventListener('change', () => {
      appState.currentOperation = operationSelect.value as OperationType;
      updateSystemPrompt();
    });
    
  } else {
    submitBtn.disabled = true;
    showError('Failed to load model. Please refresh the page and try again.');
  }
}

// Initialize the app when the page loads
initializeApp();

