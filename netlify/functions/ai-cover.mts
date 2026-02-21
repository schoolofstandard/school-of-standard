import type { Context } from '@netlify/functions';
import { callOpenAI, jsonResponse, jsonError } from './ai-utils.js';

const sizeMap: Record<string, string> = {
  '1K': '1024x1024',
  '2K': '1024x1024',
  '4K': '1024x1024',
};

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405);
  }

  try {
    const { prompt, size } = await req.json();
    if (!prompt) {
      return jsonError('Missing image prompt.', 400);
    }

    const data = await callOpenAI('/images/generations', {
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: sizeMap[size] || '1024x1024',
      response_format: 'b64_json',
    });

    const image = data?.data?.[0]?.b64_json;
    if (!image) {
      return jsonError('Image generation failed.', 502);
    }

    return jsonResponse({ image: `data:image/png;base64,${image}` });
  } catch (error: any) {
    const message = error?.message || 'Failed to generate cover image.';
    return jsonError(message, 500);
  }
};

export const config = {
  path: '/api/ai/cover',
};
