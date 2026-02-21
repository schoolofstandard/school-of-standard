import { BookOptions, BookOutline, ChapterOutline } from '../types';

const API_KEY = "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";

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

async function callOpenAI(endpoint: string, body: any) {
  const response = await fetch(`https://api.openai.com/v1${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI API Error:", errorText);
    throw new Error(`OpenAI API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const generateBookOutline = async (options: BookOptions): Promise<BookOutline> => {
  const prompt = `
    Create a detailed eBook outline based on the following parameters:
    - Topic: ${options.topic}
    - Target Audience: ${options.targetAudience}
    - Approx Page Count: ${options.pageCount}
    - Tone: ${options.tone}
    - Objective: ${options.objective}
    - Included Extras: ${options.extras.join(', ')}

    Return a JSON object with the following structure:
    {
      "title": "String",
      "subtitle": "String",
      "description": "String (approx 150 words for store listing)",
      "backCoverCopy": "String (approx 200 words)",
      "chapters": [
        { "title": "String", "description": "String" }
      ]
    }
  `;

  try {
    const data = await callOpenAI('/chat/completions', {
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const content = data.choices[0].message.content;
    return JSON.parse(content) as BookOutline;
  } catch (error) {
    console.error("Error generating outline:", error);
    throw new Error("Failed to generate outline with OpenAI.");
  }
};

export const generateChapterContent = async (
  options: BookOptions,
  bookInfo: { title: string; subtitle: string },
  chapter: ChapterOutline,
  chapterIndex: number,
  totalChapters: number
): Promise<string> => {
  const prompt = `
    Write the full content for Chapter ${chapterIndex + 1}: "${chapter.title}".
    
    **Book Context:**
    - Title: ${bookInfo.title}
    - Subtitle: ${bookInfo.subtitle}
    - Audience: ${options.targetAudience}
    - Tone: ${options.tone}
    - Author: ${options.authorName}
    
    **Chapter Description:**
    ${chapter.description}

    **Requirements:**
    - Write in Markdown format.
    - Start with a Level 1 Heading (# ${chapter.title}).
    - Use H2 (##) and H3 (###) for subheadings.
    - The content should be detailed, roughly 800-1500 words.
    - Include practical examples, actionable steps, or frameworks.
    - End with a brief "Chapter Summary" or "Key Takeaways" section.
    - IMPORTANT: Do NOT use asterisks (*) for formatting. Use hyphens (-) for lists and underscores (_) for emphasis.
  `;

  try {
    const data = await callOpenAI('/chat/completions', {
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    });

    return data.choices[0].message.content;
  } catch (error) {
    console.error(`Error generating chapter ${chapterIndex + 1}:`, error);
    return `[System Error: Could not generate content for Chapter ${chapterIndex + 1}. Please retry.]`;
  }
};

export const generateCoverImage = async (
  prompt: string, 
  size: "1K" | "2K" | "4K"
): Promise<string> => {
  try {
    // OpenAI DALL-E 3 supports 1024x1024. We ignore 'size' param mapping for simplicity or map 1K to 1024x1024.
    const data = await callOpenAI('/images/generations', {
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    });

    const b64 = data.data[0].b64_json;
    return `data:image/png;base64,${b64}`;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

export const editCoverImage = async (
  base64Image: string, 
  prompt: string
): Promise<string> => {
  // DALL-E 3 does not support direct image editing via the generations endpoint in the same way (requires masks/edits endpoint).
  // For this application's flow, we will regenerate the cover with the refined prompt to ensure high quality.
  return generateCoverImage(prompt, "1K");
};
