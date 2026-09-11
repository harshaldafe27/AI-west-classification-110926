# Waste Lens - AI Waste Classification

An intelligent waste classification and recycling material detection platform powered by Google Gemini AI and React/Vite.

## Features
- **Multimodal AI Classification**: Visual waste detection powered by Google Gemini models (`gemini-3.5-flash`, `gemini-3.7-flash`, `gemini-3.6-flash`).
- **Non-Waste Detection**: Accurately recognizes non-waste scenes (portraits, selfies, landscapes) without hallucinating garbage entries.
- **Detailed Material Breakdown**: Classifies items into Plastic, Metal, Paper, Glass, Organic, E-Waste, Expired Drugs, and Non-Recyclable with volume percentages and handling instructions.
- **Exporting**: One-click CSV download and clipboard export.

## Deploying on Vercel

This repository is pre-configured for one-click deployment on **Vercel** with Serverless Functions (`/api`) and a Vite React frontend.

### Step 1: Push or Import to GitHub
1. Push this project to a GitHub repository (or export it from Google AI Studio).

### Step 2: Import into Vercel
1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **"Add New..."** > **"Project"**.
3. Select your repository and click **"Import"**.

### Step 3: Project Settings in Vercel
Vercel will automatically detect the settings from `vercel.json` and `package.json`:
- **Framework Preset**: `Vite`
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step 4: Configure Environment Variables
Under the **Environment Variables** section on Vercel, add:
- **`GEMINI_API_KEY`**: Your Google Gemini API key (from [Google AI Studio](https://aistudio.google.com/app/apikey)).

### Step 5: Deploy
Click **"Deploy"**. Vercel will build the frontend assets into `dist` and deploy `/api/index.ts` as a serverless function with generous execution limits.

---

## Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your GEMINI_API_KEY in .env

# Run local development server
npm run dev
```
Open `http://localhost:3000` in your browser.
