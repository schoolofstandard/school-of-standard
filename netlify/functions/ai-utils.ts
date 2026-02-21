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

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)),
  ]);
};

const fetchWithRetry = async (url: string, options: RequestInit, retries = 2): Promise<Response> => {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status >= 500 || response.status === 429) {
        throw new Error(`Server status: ${response.status}`);
      }
      return response;
    } catch (error) {
      lastError = error;
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
};

const getOpenAIConfig = () => {
  const apiKey = process.env.OPENAI_API_KEY || "";
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  if (!apiKey) {
    throw new Error("OpenAI API key not configured in server environment.");
  }
  const normalizedBase = baseUrl.endsWith("/v1") ? baseUrl : `${baseUrl}/v1`;
  return { apiKey, baseUrl: normalizedBase };
};

const cleanAndParseJSON = (text: string) => {
  let clean = text.trim();
  if (clean.includes('```')) {
    clean = clean.replace(/```(?:json)?\n?([\s\S]*?)\n?```/g, '$1');
  }
  return JSON.parse(clean);
};

const callOpenAI = async (endpoint: string, body: any) => {
  const { apiKey, baseUrl } = getOpenAIConfig();
  const response = await fetchWithRetry(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`OpenAI Error: ${response.status} - ${txt}`);
  }
  return response.json();
};

const jsonResponse = (data: unknown, status = 200) => {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
};

const jsonError = (message: string, status = 500) => {
  return jsonResponse({ error: message }, status);
};

export {
  SYSTEM_INSTRUCTION,
  withTimeout,
  fetchWithRetry,
  callOpenAI,
  cleanAndParseJSON,
  jsonResponse,
  jsonError,
};
