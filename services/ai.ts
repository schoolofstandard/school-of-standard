import { GoogleGenAI, Type, Schema } from "@google/genai";
import { BookOptions, BookOutline, ChapterOutline } from '../types';

// --- Configuration ---

const KEYS = {
  OPENAI: process.env.OPENAI_API_KEY || "",
  DEEPSEEK: process.env.DEEPSEEK_API_KEY || "",
  GEMINI: process.env.GEMINI_API_KEY || process.env.API_KEY || "" // Uses environment variable for Gemini
};

const OLLAMA_URL = "http://localhost:11434/api/chat";

const SYSTEM_INSTRUCTION = `You are "School of Standard Publishing Engine", a professional publishing intelligence system.
Your task is to generate a fully structured, commercially viable, original eBook manuscript.
Requirements:
1. Generate complete, well-developed chapters.
2. Use clear, professional English.
3. Maintain logical flow and structural consistency.
4. Ensure content depth suitable for both beginners and professionals.
5. Avoid generic filler.
6. Include actionable steps, frameworks, and examples.
7. Use proper hierarchical formatting (Title, H1, H2, H3).
8. Make content suitable for PDF export.
9. Ensure originality.
10. NEVER mention that you are an AI. Write as a human expert.
11. STRICTLY FORBIDDEN: Do NOT use the asterisk character (*) for formatting. Use hyphens (-) for lists and underscores (_) for bold/italic.`;

// --- Helpers ---

// Timeout helper to prevent hanging requests
const withTimeout = (promise: Promise<any>, ms: number) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms))
  ]);
};

// Retry helper for fetch operations
const fetchWithRetry = async (url: string, options: RequestInit, retries = 2): Promise<Response> => {
  let lastError;
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);
      // Retry on 5xx server errors, but not 4xx client errors (except maybe 429)
      if (response.status >= 500 || response.status === 429) {
        throw new Error(`Server status: ${response.status}`);
      }
      return response;
    } catch (e) {
      lastError = e;
      if (i < retries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
};

// JSON Cleaner
const cleanAndParseJSON = (text: string) => {
  let clean = text.trim();
  // Remove markdown code blocks
  if (clean.includes('```')) {
    clean = clean.replace(/```(?:json)?\n?([\s\S]*?)\n?```/g, '$1');
  }
  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error("Failed to parse JSON:", clean);
    throw new Error("AI response was not valid JSON");
  }
};

// --- Providers ---

// 1. OpenAI Provider
const callOpenAI = async (endpoint: string, body: any) => {
  if (!KEYS.OPENAI) throw new Error("OpenAI Key Missing");
  const response = await fetchWithRetry(`https://api.openai.com/v1${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEYS.OPENAI}` },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`OpenAI Error: ${response.status} - ${txt}`);
  }
  return response.json();
};

// 2. DeepSeek Provider
const callDeepSeek = async (messages: any[], jsonMode: boolean = false) => {
  if (!KEYS.DEEPSEEK) throw new Error("DeepSeek Key Missing");
  // Note: DeepSeek API often uses 'deepseek-chat' for V3
  const response = await fetchWithRetry('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEYS.DEEPSEEK}` },
    body: JSON.stringify({
      model: "deepseek-chat", 
      messages: messages,
      response_format: jsonMode ? { type: "json_object" } : undefined,
      temperature: 0.7
    })
  });
  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`DeepSeek Error: ${response.status} - ${txt}`);
  }
  return response.json();
};

// 3. Gemini Provider
const callGemini = async (prompt: string, isJson: boolean, schema?: Schema) => {
  if (!KEYS.GEMINI) throw new Error("Gemini Key Missing");
  const ai = new GoogleGenAI({ apiKey: KEYS.GEMINI });
  
  const config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
    temperature: 0.7,
  };

  if (isJson) {
    config.responseMimeType = "application/json";
    if (schema) config.responseSchema = schema;
  }

  // Fallback to gemini-2.5-flash if 3-flash-preview has issues or timeouts are frequent
  // But strictly following guidelines: 'gemini-3-flash-preview' for basic text.
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: config
  });
  
  return response.text;
};

// 4. Ollama Provider (Local)
const callOllama = async (messages: any[], jsonMode: boolean = false) => {
  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "deepseek-r1:7b",
        messages: messages,
        format: jsonMode ? "json" : undefined,
        stream: false
      })
    });
    if (!response.ok) throw new Error(`Ollama Error: ${response.status}`);
    return response.json();
  } catch (e) {
    if (e instanceof TypeError && e.message === "Failed to fetch") {
      console.warn("Ollama connection failed. Ensure Ollama is running (ollama serve) and OLLAMA_ORIGINS='*' is set.");
    }
    throw e;
  }
};

// --- Orchestrators ---

export const generateBookOutline = async (options: BookOptions): Promise<BookOutline> => {
  const promptText = `
    Create a detailed eBook outline based on:
    - Topic: ${options.topic}
    - Audience: ${options.targetAudience}
    - English Style: ${options.englishStyle}
    - Page Count: ${options.pageCount}
    - Target Chapters: ${options.targetChapterCount}
    - Tone: ${options.tone}
    - Objective: ${options.objective}
    - Book Description: ${options.bookDescription || "Not provided"}
    - Extras: ${options.extras.join(', ')}

    Return a JSON object with:
    {
      "title": "String",
      "subtitle": "String",
      "description": "String (150 words)",
      "backCoverCopy": "String (200 words)",
      "chapters": [ { "title": "String", "description": "String" } ]
    }
  `;

  const messages = [
    { role: "system", content: SYSTEM_INSTRUCTION },
    { role: "user", content: promptText }
  ];

  const errors: string[] = [];

  // 1. Try Gemini (Primary - Environment Provided)
  try {
    console.log("Attempting Gemini for Outline...");
    const outlineSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        subtitle: { type: Type.STRING },
        description: { type: Type.STRING },
        backCoverCopy: { type: Type.STRING },
        chapters: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { title: { type: Type.STRING }, description: { type: Type.STRING } },
            required: ["title", "description"]
          }
        }
      },
      required: ["title", "subtitle", "description", "backCoverCopy", "chapters"]
    };
    
    // Increased timeout to 120s for Gemini
    const text = await withTimeout(callGemini(promptText, true, outlineSchema), 120000);
    if (!text) throw new Error("Empty response");
    return cleanAndParseJSON(text);
  } catch (e: any) {
    console.warn("Gemini Failed:", e.message);
    errors.push(`Gemini: ${e.message}`);
  }

  // 2. Try OpenAI (Secondary)
  try {
    console.log("Attempting OpenAI for Outline...");
    // Increased timeout to 45s for outlines
    const data = await withTimeout(callOpenAI('/chat/completions', {
      model: "gpt-4o",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.7
    }), 45000);
    return cleanAndParseJSON(data.choices[0].message.content);
  } catch (e: any) {
    console.warn("OpenAI Failed:", e.message);
    errors.push(`OpenAI: ${e.message}`);
  }

  // 3. Try DeepSeek (Tertiary)
  try {
    console.log("Attempting DeepSeek for Outline...");
    const data = await withTimeout(callDeepSeek(messages, true), 45000);
    return cleanAndParseJSON(data.choices[0].message.content);
  } catch (e: any) {
    console.warn("DeepSeek Failed:", e.message);
    errors.push(`DeepSeek: ${e.message}`);
  }

  // 4. Try Ollama (Local Fallback)
  try {
    console.log("Attempting Ollama for Outline...");
    // Long timeout for local inference on consumer hardware
    const data = await withTimeout(callOllama(messages, true), 120000); 
    return cleanAndParseJSON(data.message.content);
  } catch (e: any) {
    console.warn("Ollama Failed:", e.message);
    errors.push(`Ollama: ${e.message}`);
  }

  throw new Error("All AI providers failed. " + errors.join(", "));
};

export const generateChapterContent = async (
  options: BookOptions,
  bookInfo: { title: string; subtitle: string },
  chapter: ChapterOutline,
  chapterIndex: number,
  totalChapters: number
): Promise<string> => {
  const promptText = `
    Write Chapter ${chapterIndex + 1}: "${chapter.title}".
    Context: Title "${bookInfo.title}", Audience "${options.targetAudience}", Tone "${options.tone}", English Style "${options.englishStyle}".
    Objective: ${options.objective}
    Book Description: ${options.bookDescription || "Not provided"}
    Description: ${chapter.description}

    Requirements:
    - Markdown format.
    - Start with # ${chapter.title}.
    - Use ## and ### for sections.
    - ~1000 words.
    - NO asterisks (*). Use hyphens (-) and underscores (_).
    - Practical, actionable content.
  `;

  const messages = [
    { role: "system", content: SYSTEM_INSTRUCTION },
    { role: "user", content: promptText }
  ];

  // 1. Gemini (Primary)
  try {
    const text = await withTimeout(callGemini(promptText, false), 120000);
    if (text) return text;
  } catch (e) { console.warn("Gemini Chapter Failed", e); }

  // 2. OpenAI
  try {
    const data = await withTimeout(callOpenAI('/chat/completions', {
      model: "gpt-4o",
      messages,
      temperature: 0.7
    }), 60000);
    return data.choices[0].message.content;
  } catch (e) { console.warn("OpenAI Chapter Failed", e); }

  // 3. DeepSeek
  try {
    const data = await withTimeout(callDeepSeek(messages, false), 60000);
    return data.choices[0].message.content;
  } catch (e) { console.warn("DeepSeek Chapter Failed", e); }

  // 4. Ollama
  try {
    const data = await withTimeout(callOllama(messages, false), 180000);
    return data.message.content;
  } catch (e) { console.warn("Ollama Chapter Failed", e); }

  return `[Error: Chapter generation failed across all providers.]`;
};

// --- Image Generation (Gemini -> OpenAI) ---

export const generateCoverImage = async (prompt: string, size: "1K" | "2K" | "4K"): Promise<string> => {
  // 1. Try Gemini Imagen (Flash-Image) - Primary
  try {
    if (!KEYS.GEMINI) throw new Error("No Gemini Key");
    const ai = new GoogleGenAI({ apiKey: KEYS.GEMINI });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "3:4" }
      }
    });
    
    // Find image part
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Gemini returned no image data");
  } catch (e) {
    console.warn("Gemini Image Failed, falling back to OpenAI...", e);
  }

  // 2. Try OpenAI DALL-E 3 (Secondary)
  try {
    const data = await callOpenAI('/images/generations', {
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    });
    return `data:image/png;base64,${data.data[0].b64_json}`;
  } catch (e) {
    console.warn("DALL-E 3 Failed", e);
    throw new Error("Failed to generate cover image with all providers.");
  }
};

export const editCoverImage = async (base64: string, prompt: string): Promise<string> => {
  // Simple regeneration fallback for now as editing is complex across providers
  return generateCoverImage(prompt, "1K");
};
