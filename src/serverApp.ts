import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

export const CLASSIFICATION_PROMPT = `You are an expert waste classification AI agent.
Examine the image carefully.

FIRST: Check if the image contains any visible waste, trash, garbage, recyclable materials, scrap, litter, or discarded items.
- If NO waste or recyclable materials are visible (for example, if the image shows a portrait, person, selfie of a human face, an animal, a clean room, a document, or general surroundings without discarded trash), you MUST respond ONLY with:
NO_WASTE_DETECTED: <one sentence explaining what the image actually shows and that no waste, garbage, or recyclable materials were identified in it>.

SECOND: If waste, garbage, discarded materials, or recyclables ARE present, classify every visible waste item into exactly one of these categories:
- plastic
- metal
- paper
- glass
- organic
- non-recyclable
- e-waste
- expired drugs
- other (use only if an item is clearly visible but cannot be mapped to any category above)

Estimate the visual volume percentage for each distinct item or material grouping. All percentages must be numbers only and sum to 100.
Heavily soiled recyclable items or hazardous items are non-recyclable. Electronics and cables are e-waste. Medicine blister packs and pills are expired drugs.
Respond ONLY with valid CSV, without markdown code fences or conversational explanation.
Quote text fields with double quotes. Do not include the percent sign in the volume column.
Use exactly this header:
Item_Description,Category,Visual_Volume_Percentage,Confidence_Score,Requires_Special_Handling,Reasoning`;

export function parseCSV(content: string): Array<Record<string, string>> {
  const clean = content
    .replace(/```csv/gi, '')
    .replace(/```/g, '')
    .trim();
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
    const items: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        items.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    items.push(current.trim());
    return items;
  };

  const headers = parseLine(lines[0]);
  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    if (row.Item_Description || row.Category) {
      rows.push(row);
    }
  }
  return rows;
}

export function createApiApp() {
  const app = express();
  app.use(express.json());

  app.get(['/api/health', '/health'], (_req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      model: 'gemini-3.5-flash',
    });
  });

  app.post(['/api/classify', '/classify'], upload.single('image'), async (req, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Please upload an image.' });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please check your environment settings.',
      });
    }

    const candidateModels = [
      'gemini-3.5-flash',
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3.8-flash',
      'gemini-flash-latest',
    ];

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const imagePart = {
      inlineData: {
        mimeType: file.mimetype || 'image/jpeg',
        data: file.buffer.toString('base64'),
      },
    };
    const textPart = {
      text: CLASSIFICATION_PROMPT,
    };

    let lastError = '';

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: { parts: [textPart, imagePart] },
        });

        const rawText = (response.text || '').trim();

        // If Gemini identified that no waste is present in the image (e.g., a person's photo / selfie / landscape)
        if (rawText.toUpperCase().includes('NO_WASTE_DETECTED')) {
          const cleanMsg = rawText.replace(/NO_WASTE_DETECTED:?/i, '').trim();
          return res.json({
            noWaste: true,
            message: cleanMsg || 'No waste or recyclable items were identified in this image.',
            rows: [],
            model: modelName,
          });
        }

        const rows = parseCSV(rawText);
        if (rows.length > 0) {
          return res.json({ rows, model: modelName });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`Gemini classification with ${modelName} error:`, msg);
        lastError = msg;
      }
    }

    return res.status(502).json({
      error: `Gemini was unable to classify waste in this image. ${lastError ? `(${lastError.substring(0, 120)})` : 'Please try again.'}`,
    });
  });

  return app;
}
