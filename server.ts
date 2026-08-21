import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const MAX_PROMPT = 8000;

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '32kb' }));

  app.post('/api/gemini/generate', async (req, res) => {
    try {
      const { prompt, model, useSearch, useThinking } = req.body ?? {};
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured. The client will fall back to mock output.',
        });
      }

      const clipped = String(prompt || '').slice(0, MAX_PROMPT);
      if (!clipped.trim()) {
        return res.status(400).json({ error: 'prompt is required' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const targetModel =
        model === 'gemini-3.1-pro-preview' || model === 'gemini-2.5-pro'
          ? 'gemini-2.5-pro'
          : 'gemini-2.5-flash';

      const config: Record<string, unknown> = {};
      if (useSearch) config.tools = [{ googleSearch: {} }];
      if (useThinking) config.thinkingConfig = { thinkingBudget: 2048 };

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: clipped,
        config,
      });

      const text = response.text || '';
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

      res.json({
        text,
        searchQueries: groundingMetadata?.webSearchQueries || [],
        searchChunks: groundingMetadata?.groundingChunks || [],
        modelUsed: targetModel,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete content generation.';
      console.error('Gemini proxy error:', message);
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AetherFlow listening on http://localhost:${PORT}`);
  });
}

startServer();
