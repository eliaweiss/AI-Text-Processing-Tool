/**
 * Text processing logic with prompts for rephrase and grammar fixing
 * Now using Ollama API instead of Transformers
 */

import type {
  OperationType,
  ProcessRequest,
  ProcessResult,
  RankingRequest,
  RankingResult,
} from "./types";
import rephrasePrompt from "../prompts/rephrase.md";
import grammarPrompt from "../prompts/grammar.md";
import translatePrompt from "../prompts/translate.md";
import rankPrompt from "../prompts/rank.md";

// Ollama API configuration
const OLLAMA_API_URL = "http://localhost:11434/api/generate";

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
 * Process text with the given operation using Ollama API
 * @param model - Model name (e.g., "phi4-mini:3.8b")
 * @param request - Processing request with text and operation type
 * @returns Processing result
 */
export async function processText(
  model: string,
  request: ProcessRequest
): Promise<ProcessResult> {
  try {
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
          .replaceAll("{TEXT}", request.text)
          .replaceAll("{LANGUAGE}", request.targetLanguage || "English");
      } else {
        // Use default prompt template
        prompt = getDefaultPromptTemplate(request.operation);
      }
      prompt = prompt
        .replaceAll("{TEXT}", request.text)
        .replaceAll("{LANGUAGE}", request.targetLanguage || "English");
    } catch (error) {
      console.error("Error generating prompt:", error);
      return {
        success: false,
        error: `Error generating prompt: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }

    console.log("Generating with Ollama...");
    console.log("Prompt being sent:", prompt);

    // Call Ollama API with streaming
    const response = await fetch(OLLAMA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ollama API error:", errorText);
      return {
        success: false,
        error: `Ollama API error: ${response.status} - ${
          errorText || "Check if Ollama is running"
        }`,
      };
    }

    if (!response.body) {
      return {
        success: false,
        error: "No response body from Ollama API",
      };
    }

    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = "";
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete JSON lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            try {
              const json = JSON.parse(line);
              if (json.response) {
                accumulatedText += json.response;

                // Stream the accumulated response
                if (request.onStream) {
                  request.onStream(accumulatedText);
                }
              }

              // Check if generation is complete
              if (json.done) {
                break;
              }
            } catch (e) {
              console.error("Error parsing JSON line:", line, e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (!accumulatedText || !accumulatedText.trim()) {
      console.error("Generated text is empty");
      return {
        success: false,
        error: "Model generation failed: empty response",
      };
    }

    console.log("Raw model response:", accumulatedText);

    // Clean up the response
    const processedText = cleanResponse(accumulatedText, request.operation);

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
 * Rank multiple generations by quality using Ollama API
 * @param model - Model name (e.g., "phi4-mini:3.8b")
 * @param request - Ranking request with task and generations
 * @returns Ranking result with ordered indices
 */
export async function rankGenerations(
  model: string,
  request: RankingRequest
): Promise<RankingResult> {
  try {
    if (request.generations.length < 2) {
      // No need to rank if there's only one generation
      return {
        success: true,
        ranking: [0],
      };
    }

    // Create letter labels (A, B, C, ...)
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    // Format generations in XML
    let generationsXml = "";
    request.generations.forEach((gen, index) => {
      const letter = letters[index];
      generationsXml += `<${letter}>\n${gen}\n</${letter}>\n\n`;
    });

    // Create the ranking prompt
    const prompt = rankPrompt
      .replaceAll("{TASK}", request.task)
      .replaceAll("{GENERATIONS}", generationsXml.trim());

    console.log("Ranking prompt:", prompt);

    // Call Ollama API without streaming for ranking
    const response = await fetch(OLLAMA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Ollama API error: ${response.status} - ${errorText}`,
      };
    }

    const result = await response.json();
    const responseText = result.response;

    if (!responseText) {
      return {
        success: false,
        error: "Ranking failed: no response from Ollama",
      };
    }

    console.log("Ranking response:", responseText);

    // Extract the ranking list from response
    // Looking for pattern like [B,A,C] or B,A,C
    const rankingMatch = responseText.match(
      /\[?\s*([A-Z](?:\s*,\s*[A-Z])*)\s*\]?/
    );

    if (!rankingMatch) {
      return {
        success: false,
        error: "Could not extract ranking from response",
      };
    }

    // Parse the letters into indices
    const rankedLetters = rankingMatch[1].split(/\s*,\s*/);
    const ranking: number[] = [];

    for (const letter of rankedLetters) {
      const index = letters.indexOf(letter.trim());
      if (index >= 0 && index < request.generations.length) {
        ranking.push(index);
      }
    }

    // Validate we got all indices
    if (ranking.length !== request.generations.length) {
      return {
        success: false,
        error: `Incomplete ranking: expected ${request.generations.length} items, got ${ranking.length}`,
      };
    }

    return {
      success: true,
      ranking,
    };
  } catch (error) {
    console.error("Error ranking generations:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
