import { BookOptions, BookOutline, ChapterOutline } from '../types';

const postJSON = async <T>(path: string, body: unknown, timeoutMs = 60000): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = typeof data?.error === 'string' ? data.error : `Request failed (${response.status})`;
      throw new Error(message);
    }

    return data as T;
  } finally {
    clearTimeout(timeout);
  }
};

export const generateBookOutline = async (options: BookOptions): Promise<BookOutline> => {
  const data = await postJSON<{ outline: BookOutline }>('/api/ai/outline', { options }, 120000);
  return data.outline;
};

export const generateChapterContent = async (
  options: BookOptions,
  bookInfo: { title: string; subtitle: string },
  chapter: ChapterOutline,
  chapterIndex: number,
  totalChapters: number
): Promise<string> => {
  const data = await postJSON<{ content: string }>(
    '/api/ai/chapter',
    { options, bookInfo, chapter, chapterIndex, totalChapters },
    180000
  );
  return data.content;
};

export const generateCoverImage = async (prompt: string, size: '1K' | '2K' | '4K'): Promise<string> => {
  const data = await postJSON<{ image: string }>('/api/ai/cover', { prompt, size }, 120000);
  return data.image;
};

export const editCoverImage = async (_base64: string, prompt: string): Promise<string> => {
  return generateCoverImage(prompt, '1K');
};
