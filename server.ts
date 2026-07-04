/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Server-Side Gemini API Proxy with Search Grounding & Thinking Budgets
  app.post('/api/gemini/generate', async (req, res) => {
    try {
      const { prompt, model, useSearch, useThinking } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: 'GEMINI_API_KEY is not defined in the workspace env. Please configure it in the Secrets panel.' 
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Map requested models to production-ready Gemini 2.5 series
      const targetModel = model === 'gemini-3.1-pro-preview' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

      const config: any = {};

      if (useSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      if (useThinking) {
        config.thinkingConfig = { thinkingBudget: 2048 };
      }

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: prompt,
        config: config
      });

      const text = response.text || '';
      
      // Extract search grounding metadata if available
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      const searchQueries = groundingMetadata?.webSearchQueries || [];
      const searchChunks = groundingMetadata?.groundingChunks || [];

      res.json({
        text,
        searchQueries,
        searchChunks,
        modelUsed: targetModel
      });
    } catch (err: any) {
      console.error('Gemini proxy error:', err);
      res.status(500).json({ error: err.message || 'Failed to complete content generation.' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Configure Vite dev server or serve static assets in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite development server middleware loaded.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production builds from: ' + distPath);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AetherFlow Core Engine running on port ${PORT}`);
  });
}

startServer();
