import { createApiApp } from '../server/app.js';

const app = createApiApp();

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 60,
};

export default app;
