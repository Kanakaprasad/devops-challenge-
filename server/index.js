// devops-challenge/server/index.js
const express = require('express');
// Prefer global fetch (Node 18+). Fallback to node-fetch if available.
let fetchFn;
if (typeof globalThis.fetch === 'function') {
  fetchFn = globalThis.fetch.bind(globalThis);
} else {
  try {
    const nf = require('node-fetch');
    fetchFn = nf.default ? nf.default : nf;
  } catch (e) {
    fetchFn = null;
    console.warn('No global fetch and node-fetch not available. Install node-fetch or use Node 18+.');
  }
}

const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("⚠️ Warning: GEMINI_API_KEY is missing in .env file. Requests to Gemini will fail until you set it.");
}

// In-memory job store (demo only)
const jobs = new Map();

// Build request body in the shape the API expects
function makeGenerateContentBody(prompt, opts = {}) {
  const parts = [{ text: prompt }];
  const content = { parts };

  const body = {
    contents: [content],
  };

  const generationConfig = {};
  if (typeof opts.temperature === 'number') generationConfig.temperature = opts.temperature;
  if (typeof opts.candidateCount === 'number') generationConfig.candidateCount = opts.candidateCount;
  if (Object.keys(generationConfig).length > 0) body.generationConfig = generationConfig;

  return body;
}

// Safely extract generated text from response
function extractGeneratedText(respJson) {
  // respJson.candidates[0].content.parts[].text
  const candidate = Array.isArray(respJson?.candidates) ? respJson.candidates[0] : null;
  if (!candidate) return null;

  const content = candidate.content || candidate?.content;
  if (!content) return null;

  // content.parts may be array or object
  const parts = Array.isArray(content.parts) ? content.parts : (Array.isArray(content) ? content : null);

  if (!parts || parts.length === 0) {
    // fallback: maybe candidate.content is text itself
    return typeof content === 'string' ? content : JSON.stringify(candidate);
  }

  // join text fields from parts
  return parts.map(p => p?.text || '').join('');
}

// Helper function to call Gemini API (REST endpoint)
async function callGemini(prompt) {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key is not configured (GEMINI_API_KEY)');
  if (!fetchFn) throw new Error('fetch is not available. Use Node 18+ or install node-fetch.');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const body = makeGenerateContentBody(prompt, { temperature: 0.2, candidateCount: 1 });

  const res = await fetchFn(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API Error: ${res.status} - ${errText}`);
  }

  const json = await res.json();
  const text = extractGeneratedText(json) || '';

  return { raw: json, text };
}

// Root - friendly message
app.get('/', (req, res) => {
  res.send('Devops-challenge API is running. Use POST /ask-gemini (body: { prompt, async })');
});

// POST /ask-gemini  → synchronous + async (loading state)
app.post('/ask-gemini', async (req, res) => {
  const { prompt, async: isAsync } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required and must be a string' });
  }

  if (isAsync) {
    const jobId = uuidv4();
    jobs.set(jobId, { status: 'pending', prompt, createdAt: new Date().toISOString() });

    (async () => {
      try {
        console.log(`[${jobId}] async job start`);
        const result = await callGemini(prompt);
        jobs.set(jobId, { status: 'done', prompt, result, finishedAt: new Date().toISOString() });
        console.log(`[${jobId}] async job done`);
      } catch (err) {
        console.error(`[${jobId}] async job error:`, err.message);
        jobs.set(jobId, { status: 'failed', prompt, error: err.message, finishedAt: new Date().toISOString() });
      }
    })();

    return res.status(202).json({ jobId, status: 'pending' });
  }

  // synchronous
  try {
    console.log(`[sync] prompt len=${prompt.length}`);
    const start = Date.now();
    const result = await callGemini(prompt);
    const duration = Date.now() - start;
    return res.json({ status: 'success', durationMs: duration, text: result.text, raw: result.raw });
  } catch (err) {
    console.error('[sync] Error calling Gemini:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// GET /ask-gemini/status/:id → check async job status
app.get('/ask-gemini/status/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  return res.json(job);
});

// health
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down');
  server.close(() => process.exit(0));
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception', err);
  process.exit(1);
});
