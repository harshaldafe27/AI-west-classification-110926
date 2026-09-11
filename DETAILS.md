# Project Architecture & Directory Layout

## Directory Structure

```
├── api/                   # Vercel Serverless Functions
│   ├── index.ts           # Main API router & handler
│   ├── classify.ts        # Direct endpoint for POST /api/classify
│   └── health.ts          # Direct endpoint for GET /api/health
├── server/                # Backend services and logic
│   └── app.ts             # Express app factory, Gemini vision client, CSV parsing
├── src/                   # Frontend React Application
│   ├── App.jsx            # Main React UI component
│   ├── main.tsx           # Primary TypeScript entry point for Vite
│   ├── main.jsx           # Compatibility bridge
│   └── styles.css         # Styling
├── public/                # Static public assets
│   └── west4.jpg          # Sample test image
├── index.html             # HTML entry point (points to /src/main.tsx)
├── server.ts              # Local dev server & Cloud Run container entry point
├── vercel.json            # Vercel framework & routing configuration
├── vite.config.js         # Vite bundler configuration
└── package.json           # Dependencies and build scripts
```

## Vercel Deployment Settings
- **Framework Preset**: `Vite`
- **Build Command**: `vite build` or `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**: `GEMINI_API_KEY`
- The `/api` directory handles backend routing automatically with `bodyParser: false` to allow `multer` to handle image payloads directly.
