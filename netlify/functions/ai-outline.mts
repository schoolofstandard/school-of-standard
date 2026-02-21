import type { Context } from '@netlify/functions';
import { SYSTEM_INSTRUCTION, withTimeout, callOpenAI, cleanAndParseJSON, jsonResponse, jsonError } from './ai-utils.js';

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405);
  }

  try {
    const { options } = await req.json();
    if (!options) {
      return jsonError('Missing book options.', 400);
    }

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
- Extras: ${(options.extras || []).join(', ')}

Return a JSON object with:
{
  "title": "String",
  "subtitle": "String",
  "description": "String (150 words)",
  "backCoverCopy": "String (200 words)",
  "chapters": [ { "title": "String", "description": "String" } ]
}
`;

    const data = await withTimeout(callOpenAI('/chat/completions', {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        { role: 'user', content: promptText },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }), 45000);

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return jsonError('Empty AI response.', 502);
    }

    const outline = cleanAndParseJSON(content);
    return jsonResponse({ outline });
  } catch (error: any) {
    const message = error?.message || 'Failed to generate outline.';
    return jsonError(message, 500);
  }
};

export const config = {
  path: '/api/ai/outline',
};
