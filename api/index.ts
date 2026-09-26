import app from '../server.ts';

// Vercel Serverless Function Handler
export default function handler(req: any, res: any) {
  // Normalize req.url so routes match whether Vercel passes '/api/...' or stripped path '/...'
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? req.url : `/${req.url}`}`;
  }
  return app(req, res);
}
