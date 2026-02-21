import type { Context } from '@netlify/functions';
import { SYSTEM_INSTRUCTION, withTimeout, callOpenAI, jsonResponse, jsonError } from './ai-utils.js';

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405);
  }

  try {
    const { options, bookInfo, chapter, chapterIndex, totalChapters } = await req.json();
    if (!options || !bookInfo || !chapter) {
      return jsonError('Missing generation payload.', 400);
    }

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

    const data = await withTimeout(callOpenAI('/chat/completions', {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        { role: 'user', content: promptText },
      ],
      temperature: 0.7,
    }), 60000);

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return jsonError('Empty AI response.', 502);
    }

    return jsonResponse({ content, chapterIndex, totalChapters });
  } catch (error: any) {
    const message = error?.message || 'Failed to generate chapter.';
    return jsonError(message, 500);
  }
};

export const config = {
  path: '/api/ai/chapter',
};
