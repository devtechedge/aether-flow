import { GoogleGenAI } from '@google/genai';

type Req = {
  method?: string;
  body?: {
    prompt?: string;
    model?: string;
    useSearch?: boolean;
    useThinking?: boolean;
  };
};

type Res = {
  status: (code: number) => Res;
  json: (body: unknown) => void;
};

const MAX_PROMPT = 8000;

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({
      error: 'GEMINI_API_KEY is not configured. The client will fall back to mock output.',
    });
    return;
  }

  const prompt = (req.body?.prompt || '').slice(0, MAX_PROMPT);
  if (!prompt.trim()) {
    res.status(400).json({ error: 'prompt is required' });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const targetModel =
      req.body?.model === 'gemini-3.1-pro-preview' || req.body?.model === 'gemini-2.5-pro'
        ? 'gemini-2.5-pro'
        : 'gemini-2.5-flash';

    const config: Record<string, unknown> = {};
    if (req.body?.useSearch) {
      config.tools = [{ googleSearch: {} }];
    }
    if (req.body?.useThinking) {
      config.thinkingConfig = { thinkingBudget: 2048 };
    }

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: prompt,
      config,
    });

    const text = response.text || '';
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    res.status(200).json({
      text,
      searchQueries: groundingMetadata?.webSearchQueries || [],
      searchChunks: groundingMetadata?.groundingChunks || [],
      modelUsed: targetModel,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to complete content generation.';
    res.status(500).json({ error: message });
  }
}
