import OpenAI from "openai";

const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

if (!API_KEY) {
  console.error("OpenAI API key is missing. Please check your .env file.");
}

console.log("API Key:", API_KEY ? "API key is set" : "API key is missing");

const openai = new OpenAI({
  apiKey: API_KEY ?? "", // Use empty string as fallback
  dangerouslyAllowBrowser: true, // This is not recommended for production
});

const PROMPT_1 = `
You are an Etsy listing optimizer. Your task is to optimize the following product title and description for better visibility and sales on Etsy. Use the provided guidelines to improve the listing while maintaining its original context and product type.

Original Title: {title}
Original Description: {description}

Guidelines for optimization:

1. Title:
   - Keep it under 140 characters
   - Include key product features and materials
   - Use relevant keywords for searchability:

2. Description:
   - Start with a concise introduction (around 300 characters)
   - Use ALL CAPS for main section headers (e.g., ITEM DETAILS, MEASUREMENTS, MATERIALS, HOW TO ORDER, SHIPPING)
   - Do NOT use bullet points for section headers
   - Under each section header, list items should use bullet points "•" instead of "-" or any other symbol
   - Use emojis sparingly for better readability
   - Maintain the original product type and key features
   - Keep any existing URLs exactly as they are without any modifications or embeddings

Example format:
MATERIALS
• Item 1
• Item 2

MEASUREMENTS
• Measurement 1
• Measurement 2

Please provide the optimized title and description based on these guidelines.

Provide the result in the following format:
Title: [Optimized Title]
Description: [Optimized Description]
`;

const PROMPT_2 = `
You are an Etsy listing optimizer. Your task is to optimize the following product title and description for better visibility and sales on Etsy. Use the provided guidelines to improve the listing while maintaining its original context and product type.

Original Title: {title}
Original Description: {description}

Guidelines for optimization:

1. Title:
   - Start with primary materials
   - Optimize for approximately 80 characters
   - Include long-tail keywords
   - Remove repetitive words
   - Use commas to separate phrases
   - Include use case or gift idea

2. Description:
   - Begin with a keyword-rich introduction (around 300 characters)
   - Use ALL CAPS for main section headers (e.g., MATERIALS, SIZING, PACKAGING AND SHIPPING)
   - Do NOT use bullet points for section headers
   - Under each section header, use bullet points "•" for listing specific features, details, or options
   - Ensure all list items use "•" instead of "-" or any other symbol
   - Include important notes clearly
   - When including links in the description, show the full URL (e.g., https://etsy.com) instead of [link] and do not put the URLs in square brackets.

   Example format:
MATERIALS
• Material 1
• Material 2

SIZING
• Size detail 1
• Size detail 2

Please provide the optimized title and description based on these guidelines.

Provide the result in the following format:
Title: [Optimized Title]
Description: [Optimized Description]
`;

export async function optimizeText(
  title: string,
  description: string,
  version: number,
  storeUrl?: string // Make storeUrl optional
): Promise<{ title: string; description: string }> {
  if (!API_KEY) {
    throw new Error("OpenAI API key is missing. Please check your .env file.");
  }

  const prompt = (version === 1 ? PROMPT_1 : PROMPT_2)
    .replace("{title}", title)
    .replace("{description}", description);

  try {
    console.log("Sending request to OpenAI API...");
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that optimizes Etsy listings.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 1000,
      n: 1,
      temperature: 0.7,
    });
    console.log("Received response from OpenAI API:", response);

    if (
      !response.choices ||
      response.choices.length === 0 ||
      !response.choices[0].message ||
      !response.choices[0].message.content
    ) {
      throw new Error("Invalid or empty response from OpenAI API");
    }

    const result = response.choices[0].message.content.trim().split("\n");
    if (result.length < 2) {
      throw new Error("Unexpected response format from OpenAI API");
    }
    console.log("merging");
    const optimizedTitle = result[0].replace("Title: ", "").trim();
    let optimizedDescription = result
      .slice(1)
      .join("\n")
      .replace("Description: ", "")
      .trim()
      .replace(/^\s+/gm, ""); // Remove leading spaces from each line

    // Add a double line break before section headers
    optimizedDescription = optimizedDescription.replace(
      /\n+([A-Z]+)\n+/g,
      "\n\n$1\n"
    );

    // Ensure there's a line break after each bullet point list
    optimizedDescription = optimizedDescription.replace(
      /(\n• [^\n]+)+\n+/g,
      "$&\n"
    );

    // Ensure there's a line break after each paragraph (non-bullet point, non-header lines)
    optimizedDescription = optimizedDescription.replace(
      /([^•\n][^\n]+)\n+(?![A-Z]+\n|• )/g,
      "$1\n\n"
    );

    // Remove any remaining multiple consecutive line breaks
    optimizedDescription = optimizedDescription.replace(/\n{3,}/g, "\n\n");

    // Append "Back to shop" URL if store name is provided
    if (storeUrl) {
      optimizedDescription += `\n\nBack to shop:\n${storeUrl}`;
    }

    return {
      title: optimizedTitle,
      description: optimizedDescription,
    };
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    if (error instanceof Error && "response" in error) {
      console.error("OpenAI API error response:", (error as any).response.data);
    }
    throw new Error(
      `Optimization failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export interface BulkOptimizeItem {
  listingId: string;
  title: string;
  description: string;
  storeUrl: string;
}

export interface OptimizedBulkItem {
  listingId: string;
  optimizedTitle: string;
  optimizedDescription: string;
}

export async function optimizeBulk(
  data: BulkOptimizeItem[],
  version: number
): Promise<OptimizedBulkItem[]> {
  console.log("Data received for bulk optimization:", data); // Log incoming data

  const results = await Promise.all(
    data.map(async (item) => {
      const optimized = await optimizeText(
        item.title,
        item.description,
        version,
        item.storeUrl
      );
      return {
        listingId: item.listingId,
        optimizedTitle: optimized.title,
        optimizedDescription: optimized.description,
      };
    })
  );

  console.log("Optimized bulk results:", results); // Log outgoing results
  return results;
}
