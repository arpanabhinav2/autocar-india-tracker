import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'vercel-api-emulator',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/')) {
              const urlPath = req.url.split('?')[0];
              const apiFile = path.join(process.cwd(), urlPath + '.js');

              if (fs.existsSync(apiFile)) {
                // Ensure required env vars are pushed to process.env locally
                process.env.RAZORPAY_KEY_ID = env.RAZORPAY_KEY_ID;
                process.env.RAZORPAY_KEY_SECRET = env.RAZORPAY_KEY_SECRET;

                try {
                  // Dynamically import the ES module handler
                  const moduleUrl = 'file://' + apiFile.replace(/\\/g, '/') + '?update=' + Date.now();
                  const module = await import(/* @vite-ignore */ moduleUrl);
                  const handler = module.default;

                  let bodyStr = '';
                  req.on('data', chunk => { bodyStr += chunk.toString(); });
                  
                  req.on('end', async () => {
                    // Populate req.body exactly like Vercel environments do
                    if (bodyStr) {
                      try { (req as any).body = JSON.parse(bodyStr); } catch (e) {}
                    }
                    
                    // Mock Vercel res.status and res.json methods
                    (res as any).status = (code: number) => { res.statusCode = code; return res; };
                    (res as any).json = (data: any) => {
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify(data));
                    };

                    await handler(req, res);
                  });
                  return; // Stop the chain, API handled the request
                } catch (error) {
                  console.error('Local Vite API Emulator Error:', error);
                  res.statusCode = 500;
                  res.end('Internal Server Error');
                  return;
                }
              }
            }
            // If not an API route, continue Vite pipeline
            next();
          });
        }
      }
    ],
  };
});
