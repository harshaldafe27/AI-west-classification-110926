# Tech Stack and Architecture Details

## Overview
Waste Lens is a full-stack waste classification application that leverages Google Gemini's multimodal vision models to identify and categorize recyclable, compostable, hazardous, and non-recyclable materials from user-supplied photos or live camera captures.

## Architecture
- **Frontend**: React 18 with Vite, Lucide React icons, and tailored CSS styling.
- **Backend**: Node.js Express API server with `@google/genai` and `multer` for memory storage image processing.
- **Vercel Serverless Function**: `/api/index.ts` exposes the Express endpoints directly on Vercel without requiring a dedicated virtual machine.
- **AI Model**: Google Gemini Flash vision models (`gemini-3.5-flash`, `gemini-3.7-flash`, `gemini-3.6-flash`).

## Vercel Deployment Configuration
- `vercel.json`:
  - Maps `/api/(.*)` to the `/api` Serverless Function.
  - Rewrites client routes to `/index.html` for single-page app support.
- `api/index.ts`:
  - Exports the Express API app.
  - Sets `bodyParser: false` to allow Multer to handle incoming `multipart/form-data` uploads seamlessly.
  - Sets `maxDuration: 60` seconds for reliable AI visual inference.
- Environment variable required on Vercel: `GEMINI_API_KEY`.
