/**
 * Text processing logic with prompts for rephrase and grammar fixing
 */

import type { OperationType, ProcessRequest, ProcessResult } from './types';

// Default prompt templates for different operations
export const DEFAULT_PROMPTS = {
  rephrase: (text: string) => `Rewrite the following text to be more concise while preserving its meaning. Only output the rewritten text, nothing else.

Text: ${text}

Rewritten:`,
  
  grammar: (text: string) => `Fix only the grammatical and punctuation errors in the following text. Keep the original wording and sentence structure as much as possible. Only output the corrected text, nothing else.

Text: ${text}

Corrected:`
};

/**
 * Get the default prompt template for an operation
 */
export function getDefaultPromptTemplate(operation: OperationType): string {
  switch (operation) {
    case 'rephrase':
      return `Rewrite the following text to be more concise while preserving its meaning. Only output the rewritten text, nothing else.

Text: {TEXT}

Rewritten:`;
    case 'grammar':
      return `Fix only the grammatical and punctuation errors in the following text. Keep the original wording and sentence structure as much as possible. Only output the corrected text, nothing else.

Text: {TEXT}

Corrected:`;
    default:
      return `Process the following text:

Text: {TEXT}

Result:`;
  }
}

/**
 * Process text with the given operation
 * @param model - The loaded model
 * @param tokenizer - The loaded tokenizer
 * @param request - Processing request with text and operation type
 * @returns Processing result
 */
export async function processText(
  model: any,
  tokenizer: any,
  request: ProcessRequest
): Promise<ProcessResult> {
  try {
    if (!model || !tokenizer) {
      return {
        success: false,
        error: 'Model or tokenizer not loaded'
      };
    }

    if (!request.text.trim()) {
      return {
        success: false,
        error: 'Please enter some text to process'
      };
    }

    // Get the appropriate prompt for the operation
    let prompt: string;
    
    if (request.customPrompt && request.customPrompt.trim()) {
      // Use custom prompt, replacing {TEXT} placeholder with actual text
      prompt = request.customPrompt.replace('{TEXT}', request.text);
    } else {
      // Use default prompt
      prompt = DEFAULT_PROMPTS[request.operation](request.text);
    }

    // Create messages for the model
    const messages = [
      {
        role: 'user',
        content: prompt
      }
    ];

    // Apply chat template to format the input
    const chatInput = tokenizer.apply_chat_template(messages, {
      add_generation_prompt: true,
      return_dict: true,
    });

    // Generate response using the model
    const generationConfig: any = {
      ...chatInput,
      max_new_tokens: 512,
      do_sample: true,
      temperature: 0.7,
      top_p: 0.9,
      return_dict_in_generate: true,
    };
    
    // Add seed if provided for variation generation
    if (request.seed !== undefined) {
      // Note: transformers.js doesn't directly support seed, but we can vary temperature slightly
      // to create variations. We'll use seed to modify temperature
      const seedVariation = (request.seed % 10) / 20; // 0 to 0.5
      generationConfig.temperature = 0.6 + seedVariation;
    }
    
    const { sequences } = await model.generate(generationConfig);

    // Decode the generated text
    const response = tokenizer.batch_decode(
      sequences.slice(null, [chatInput.input_ids.dims[1], null]),
      { skip_special_tokens: true }
    )[0];

    // Clean up the response
    const processedText = cleanResponse(response, request.operation);

    return {
      success: true,
      processedText
    };
  } catch (error) {
    console.error('Error processing text:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Clean up the model response
 * @param response - Raw response from the model
 * @param operation - The operation type
 * @returns Cleaned text
 */
function cleanResponse(response: string, operation: OperationType): string {
  let cleaned = response.trim();
  
  // Remove common prefixes
  const prefixes = ['Rewritten:', 'Corrected:', 'Text:', 'Output:'];
  for (const prefix of prefixes) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.substring(prefix.length).trim();
    }
  }
  
  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '').trim();
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1').trim();
  
  return cleaned;
}

/**
 * Get a description of the operation
 * @param operation - The operation type
 * @returns Human-readable description
 */
export function getOperationDescription(operation: OperationType): string {
  switch (operation) {
    case 'rephrase':
      return 'Making text more concise...';
    case 'grammar':
      return 'Fixing grammar and punctuation...';
    default:
      return 'Processing text...';
  }
}

