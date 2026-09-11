import { createApiApp } from '../src/serverApp.js';

const app = createApiApp();

// Vercel Serverless Function configuration
// Disable built-in body parsing so Multer can process multipart/form-data directly
export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 60,
};

export default app;

