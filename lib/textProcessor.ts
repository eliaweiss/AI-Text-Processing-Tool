/**
 * Text processing logic with prompts for rephrase and grammar fixing
 */

import { TextStreamer } from "@huggingface/transformers";
import type { OperationType, ProcessRequest, ProcessResult } from "./types";
import rephrasePrompt from "../prompts/rephrase.md";
import grammarPrompt from "../prompts/grammar.md";
import translatePrompt from "../prompts/translate.md";

/**
 * Get the default prompt template for an operation
 */
export function getDefaultPromptTemplate(operation: OperationType): string {
  switch (operation) {
    case "rephrase":
      return rephrasePrompt;

    case "grammar":
      return grammarPrompt;

    case "translate":
    case "translate-pt":
    case "translate-en":
      return translatePrompt;

    default:
      throw new Error(`Unsupported operation: ${operation}`);
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
        error: "Model or tokenizer not loaded",
      };
    }

    if (!request.text.trim()) {
      return {
        success: false,
        error: "Please enter some text to process",
      };
    }

    // Get the appropriate prompt for the operation
    let prompt: string;

    try {
      if (request.customPrompt && request.customPrompt.trim()) {
        // Use custom prompt, replacing placeholders
        prompt = request.customPrompt
          .replace("{TEXT}", request.text)
          .replace("{LANGUAGE}", request.targetLanguage || "English");
      } else {
        // Use default prompt template
        const template = getDefaultPromptTemplate(request.operation);
        prompt = template
          .replace("{TEXT}", request.text)
          .replace("{LANGUAGE}", request.targetLanguage || "English");
      }
    } catch (error) {
      console.error("Error generating prompt:", error);
      return {
        success: false,
        error: `Error generating prompt: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }

    // Create messages for the model
    const messages = [
      {
        role: "user",
        content: prompt,
      },
    ];

    // Apply chat template to format the input
    const chatInput = tokenizer.apply_chat_template(messages, {
      add_generation_prompt: true,
      return_dict: true,
    });

    // Generate response using the model - dont change this code
    const generationConfig: any = {
      ...chatInput,
      max_new_tokens: 512,
      do_sample: true,
      temperature: 1,
      return_dict_in_generate: true,
    };

    // Add seed if provided for variation generation
    if (request.seed !== undefined) {
      generationConfig.seed = request.seed;
    }
    ////////

    console.log("Generating with config:", {
      operation: request.operation,
      temperature: generationConfig.temperature,
      max_new_tokens: generationConfig.max_new_tokens,
      seed: generationConfig.seed,
    });
    console.log("Prompt being sent:", prompt);

    // Add streaming callback if provided
    if (request.onStream) {
      let accumulatedText = "";
      const streamer = new TextStreamer(tokenizer, {
        skip_prompt: true,
        skip_special_tokens: true,
        callback_function: (text: string) => {
          console.log("Streaming chunk:", text);
          // Accumulate the text
          accumulatedText += text;

          // Stream the accumulated response (clean minimally to avoid breaking partial text)
          if (request.onStream) {
            // Send the raw accumulated text for now, we'll clean it at the end
            request.onStream(accumulatedText);
          }
        },
      });

      generationConfig.streamer = streamer;
    }

    const result = await model.generate(generationConfig);

    if (!result || !result.sequences) {
      console.error("Model generate returned unexpected result:", result);
      return {
        success: false,
        error: "Model generation failed: no sequences returned",
      };
    }

    const { sequences } = result;

    // Decode the generated text
    const response = tokenizer.batch_decode(
      sequences.slice(null, [chatInput.input_ids.dims[1], null]),
      { skip_special_tokens: true }
    )[0];

    if (!response) {
      console.error("Tokenizer decode returned empty response");
      return {
        success: false,
        error: "Model generation failed: empty response from decoder",
      };
    }

    console.log("Raw model response:", response);

    // Clean up the response
    const processedText = cleanResponse(response, request.operation);

    if (!processedText || !processedText.trim()) {
      console.error("Cleaned response is empty");
      return {
        success: false,
        error: "Model generation failed: empty result after cleaning",
      };
    }

    return {
      success: true,
      processedText,
    };
  } catch (error) {
    console.error("Error processing text:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
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
  const prefixes = [
    "Rewritten:",
    "Corrected:",
    "Simplified:",
    "Expanded:",
    "Formal version:",
    "Casual version:",
    "Bullet points:",
    "Paragraph:",
    "Cleaned:",
    "Translation:",
    "Text:",
    "Output:",
    "Result:",
  ];

  // Also check for language-specific translation prefixes (e.g., "Portuguese translation:", "English translation:")
  const translationPrefixMatch = cleaned.match(/^[A-Za-z]+\s+translation:\s*/);
  if (translationPrefixMatch) {
    cleaned = cleaned.substring(translationPrefixMatch[0].length).trim();
  } else {
    // Try standard prefixes
    for (const prefix of prefixes) {
      if (cleaned.startsWith(prefix)) {
        cleaned = cleaned.substring(prefix.length).trim();
        break;
      }
    }
  }

  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "").trim();
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1").trim();

  return cleaned;
}

/**
 * Get a description of the operation
 * @param operation - The operation type
 * @returns Human-readable description
 */
export function getOperationDescription(operation: OperationType): string {
  switch (operation) {
    case "rephrase":
      return "Making text more concise...";
    case "grammar":
      return "Fixing grammar and punctuation...";
    case "simplify":
      return "Simplifying text...";
    case "expand":
      return "Expanding and elaborating...";
    case "formal":
      return "Converting to formal tone...";
    case "casual":
      return "Converting to casual tone...";
    case "to-bullets":
      return "Converting to bullet points...";
    case "to-paragraph":
      return "Converting to paragraph...";
    case "remove-filler":
      return "Removing filler words...";
    case "translate":
    case "translate-pt":
    case "translate-en":
      return "Translating text...";
    default:
      return "Processing text...";
  }
}
