import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { BookOptions, BookOutline, ChapterOutline } from '../types';

const getAiClient = () => {
  // Ensure we are accessing the key safely
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing");
    throw new Error("API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({ apiKey });
};

const SYSTEM_INSTRUCTION = `You are "School of Standard Publishing Engine", a professional publishing intelligence system powered by the School of Standard.
Your task is to generate a fully structured, commercially viable, original eBook manuscript based on user-provided inputs.
Requirements:
1. Generate complete, well-developed chapters.
2. Use clear, professional English.
3. Maintain logical flow and structural consistency.
4. Ensure content depth suitable for both beginners and professionals.
5. Avoid generic filler or repetition.
6. Include actionable steps, frameworks, and examples.
7. Use proper hierarchical formatting (Title, H1, H2, H3).
8. Make content suitable for PDF export and commercial publishing.
9. Ensure originality and avoid plagiarism.
10. NEVER mention that you are an AI, an algorithm, or a machine. Write strictly as a human expert author or professional publisher.
11. STRICTLY FORBIDDEN: Do NOT use the asterisk character (*) anywhere in the text. Use hyphens (-) for bullet points. Use underscores (_) for bold or italic formatting if needed.`;

// Helper for timeout to prevent indefinite hanging
const withTimeout = async <T>(promise: Promise<T>, ms: number, errorMessage = "Operation timed out"): Promise<T> => {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), ms);
  });
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const generateBookOutline = async (options: BookOptions): Promise<BookOutline> => {
  const ai = getAiClient();
  
  const prompt = `
    Create a detailed eBook outline based on the following parameters:
    - Topic: ${options.topic}
    - Target Audience: ${options.targetAudience}
    - English Style: ${options.englishStyle}
    - Approx Page Count: ${options.pageCount}
    - Target Chapters: ${options.targetChapterCount}
    - Tone: ${options.tone}
    - Objective: ${options.objective}
    - Book Description: ${options.bookDescription || "Not provided"}
    - Included Extras: ${options.extras.join(', ')}

    The outline should include:
    1. A catchy Title and Subtitle.
    2. A compelling "Book Description" (approx 150 words) suitable for an online store listing (e.g. Amazon description).
    3. "Back Cover Copy" (approx 200 words) that sells the book, including a strong hook and key benefits/takeaways.
    4. A list of 8-12 chapters (depending on the requested length) with brief descriptions for each.
    The chapter descriptions should highlight the key takeaways and structure of that chapter.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "The main title of the book" },
      subtitle: { type: Type.STRING, description: "A compelling subtitle" },
      description: { type: Type.STRING, description: "Marketing description for the book listing" },
      backCoverCopy: { type: Type.STRING, description: "Persuasive copy for the back cover of the book" },
      chapters: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Chapter title" },
            description: { type: Type.STRING, description: "Brief summary of what the chapter covers" }
          },
          required: ["title", "description"]
        }
      }
    },
    required: ["title", "subtitle", "description", "backCoverCopy", "chapters"]
  };

  try {
    const generatePromise = ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      }
    });

    // 45 second timeout for outline generation
    const response = await withTimeout(generatePromise, 45000) as GenerateContentResponse;

    if (!response.text) {
      throw new Error("No content generated");
    }

    // Robust JSON cleaning: Remove markdown code blocks if present
    let jsonString = response.text.trim();
    
    // Remove wrapping ```json ... ``` or just ``` ... ```
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```(json)?\n/, '').replace(/\n```$/, '');
    }

    return JSON.parse(jsonString) as BookOutline;

  } catch (error) {
    console.error("Error generating outline:", error);
    throw new Error("Failed to generate outline. Please try again or check your API key.");
  }
};

export const generateChapterContent = async (
  options: BookOptions,
  bookInfo: { title: string; subtitle: string },
  chapter: ChapterOutline,
  chapterIndex: number,
  totalChapters: number
): Promise<string> => {
  const ai = getAiClient();

  const prompt = `
    Write the full content for Chapter ${chapterIndex + 1}: "${chapter.title}".
    
    **Book Context:**
    - Title: ${bookInfo.title}
    - Subtitle: ${bookInfo.subtitle}
    - Audience: ${options.targetAudience}
    - English Style: ${options.englishStyle}
    - Tone: ${options.tone}
    - Author: ${options.authorName}
    - Objective: ${options.objective}
    - Book Description: ${options.bookDescription || "Not provided"}
    
    **Chapter Description:**
    ${chapter.description}

    **Requirements:**
    - Write in Markdown format.
    - Start with a Level 1 Heading (# ${chapter.title}).
    - Use H2 (##) and H3 (###) for subheadings.
    - The content should be detailed, roughly 800-1500 words depending on the topic depth required.
    - Include practical examples, actionable steps, or frameworks where relevant.
    - End with a brief "Chapter Summary" or "Key Takeaways" section.
    - Ensure the voice matches the requested "${options.tone}" tone.
    - Do NOT include the book title or other chapters, ONLY the content for this specific chapter.
    - IMPORTANT: Do NOT use asterisks (*) for formatting. Use hyphens (-) for lists and underscores (_) for emphasis.
  `;

  try {
    const generatePromise = ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    // 60 second timeout for chapter generation
    const response = await withTimeout(generatePromise, 60000) as GenerateContentResponse;

    return response.text || `[Error: content not generated for Chapter ${chapterIndex + 1}]`;
  } catch (error) {
    console.error(`Error generating chapter ${chapterIndex + 1}:`, error);
    return `[System Error: Could not generate content for Chapter ${chapterIndex + 1}. Please retry.]`;
  }
};

export const generateCoverImage = async (
  prompt: string, 
  size: "1K" | "2K" | "4K"
): Promise<string> => {
  const ai = getAiClient();
  try {
    // Switch to gemini-2.5-flash-image to avoid 403 PERMISSION_DENIED on standard keys
    // gemini-3-pro-image-preview requires specific billing/allowlisting setup
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4", // Standard book cover ratio
          // imageSize is not supported in 2.5-flash-image, so we remove it
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

export const editCoverImage = async (
  base64Image: string, 
  prompt: string
): Promise<string> => {
  const ai = getAiClient();
  try {
    // Strip data url prefix if present to get raw base64
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/png'
            }
          },
          { text: prompt }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
}