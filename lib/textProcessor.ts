/**
 * Text processing logic with prompts for rephrase and grammar fixing
 */

import type { OperationType, ProcessRequest, ProcessResult } from './types';

// Default prompt templates for different operations
export const DEFAULT_PROMPTS: Record<string, (text: string) => string> = {
  rephrase: (text: string) => `Rewrite the following text to be more concise while preserving its meaning. Only output the rewritten text, nothing else.

Text: ${text}

Rewritten:`,
  
  grammar: (text: string) => `Fix only the grammatical and punctuation errors in the following text. Keep the original wording and sentence structure as much as possible. Only output the corrected text, nothing else.

Text: ${text}

Corrected:`,

  simplify: (text: string) => `Rewrite the following text to be simpler and easier to understand. Use simpler words and shorter sentences as if explaining to a 10-year-old. Only output the simplified text, nothing else.

Text: ${text}

Simplified:`,

  expand: (text: string) => `Expand and elaborate on the following text. Add more detail, context, and explanations while keeping the same meaning. Only output the expanded text, nothing else.

Text: ${text}

Expanded:`,

  formal: (text: string) => `Rewrite the following text in a formal and professional tone. Remove casual language, slang, and contractions. Only output the formal version, nothing else.

Text: ${text}

Formal version:`,

  casual: (text: string) => `Rewrite the following text in a casual and conversational tone. Make it friendly and approachable. Only output the casual version, nothing else.

Text: ${text}

Casual version:`,

  'to-bullets': (text: string) => `Convert the following text into clear, concise bullet points. Each bullet should be a separate key point. Only output the bullet points, nothing else.

Text: ${text}

Bullet points:`,

  'to-paragraph': (text: string) => `Convert the following bullet points into a well-flowing paragraph. Connect the ideas smoothly. Only output the paragraph, nothing else.

Text: ${text}

Paragraph:`,

  'remove-filler': (text: string) => `Remove all filler words and phrases from the following text (like "um", "like", "basically", "actually", "you know", etc.). Keep the meaning intact. Only output the cleaned text, nothing else.

Text: ${text}

Cleaned:`,

  translate: (text: string, targetLanguage: string = 'English') => `Translate the following text to ${targetLanguage}. Automatically detect the source language. Only output the translated text, nothing else.

Text: ${text}

Translation:`
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
    
    case 'simplify':
      return `Rewrite the following text to be simpler and easier to understand. Use simpler words and shorter sentences as if explaining to a 10-year-old. Only output the simplified text, nothing else.

Text: {TEXT}

Simplified:`;
    
    case 'expand':
      return `Expand and elaborate on the following text. Add more detail, context, and explanations while keeping the same meaning. Only output the expanded text, nothing else.

Text: {TEXT}

Expanded:`;
    
    case 'formal':
      return `Rewrite the following text in a formal and professional tone. Remove casual language, slang, and contractions. Only output the formal version, nothing else.

Text: {TEXT}

Formal version:`;
    
    case 'casual':
      return `Rewrite the following text in a casual and conversational tone. Make it friendly and approachable. Only output the casual version, nothing else.

Text: {TEXT}

Casual version:`;
    
    case 'to-bullets':
      return `Convert the following text into clear, concise bullet points. Each bullet should be a separate key point. Only output the bullet points, nothing else.

Text: {TEXT}

Bullet points:`;
    
    case 'to-paragraph':
      return `Convert the following bullet points into a well-flowing paragraph. Connect the ideas smoothly. Only output the paragraph, nothing else.

Text: {TEXT}

Paragraph:`;
    
    case 'remove-filler':
      return `Remove all filler words and phrases from the following text (like "um", "like", "basically", "actually", "you know", etc.). Keep the meaning intact. Only output the cleaned text, nothing else.

Text: {TEXT}

Cleaned:`;
    
    case 'translate':
      return `Translate the following text to {LANGUAGE}. Automatically detect the source language. Only output the translated text, nothing else.

Text: {TEXT}

Translation:`;
    
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
      // Use custom prompt, replacing placeholders
      prompt = request.customPrompt
        .replace('{TEXT}', request.text)
        .replace('{LANGUAGE}', request.targetLanguage || 'English');
    } else {
      // Use default prompt
      if (request.operation === 'translate') {
        const targetLang = request.targetLanguage || 'English';
        prompt = DEFAULT_PROMPTS.translate(request.text, targetLang);
      } else {
        prompt = DEFAULT_PROMPTS[request.operation](request.text);
      }
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
  const prefixes = ['Rewritten:', 'Corrected:', 'Simplified:', 'Expanded:', 
                    'Formal version:', 'Casual version:', 'Bullet points:', 
                    'Paragraph:', 'Cleaned:', 'Translation:', 'Text:', 'Output:', 'Result:'];
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
    case 'simplify':
      return 'Simplifying text...';
    case 'expand':
      return 'Expanding and elaborating...';
    case 'formal':
      return 'Converting to formal tone...';
    case 'casual':
      return 'Converting to casual tone...';
    case 'to-bullets':
      return 'Converting to bullet points...';
    case 'to-paragraph':
      return 'Converting to paragraph...';
    case 'remove-filler':
      return 'Removing filler words...';
    case 'translate':
      return 'Translating text...';
    default:
      return 'Processing text...';
  }
}

