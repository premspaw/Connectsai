import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import http from 'node:http';
import { getMockResponse } from './src/mockApi.js';

function mockApiPlugin() {
  return {
    name: 'mock-api-fallback',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url.startsWith('/api')) {
          return next();
        }

        // Server-Sent Events (SSE) support for Chats / real-time updates
        if (req.url.startsWith('/api/events')) {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });
          res.write(': connected\n\n');
          const interval = setInterval(() => {
            try { res.write(': keepalive\n\n'); } catch { clearInterval(interval); }
          }, 15000);
          req.on('close', () => clearInterval(interval));
          return;
        }

        // Meta WhatsApp Webhook Verification Handshake & Inbound Receiver
        if (req.url.startsWith('/api/webhook/whatsapp') || req.url.startsWith('/api/webhook')) {
          if (req.method === 'GET') {
            const parsed = new URL(req.url, 'http://localhost');
            const mode = parsed.searchParams.get('hub.mode');
            const challenge = parsed.searchParams.get('hub.challenge');
            if (mode === 'subscribe' && challenge) {
              res.writeHead(200, {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*',
              });
              res.end(challenge);
              return;
            }
          }
          if (req.method === 'POST') {
            const chunks = [];
            req.on('data', c => chunks.push(c));
            req.on('end', () => {
              let bodyObj = null;
              try {
                const raw = Buffer.concat(chunks).toString('utf8');
                if (raw) bodyObj = JSON.parse(raw);
              } catch {}
              const data = getMockResponse(req.url, req.method, bodyObj);
              if (!res.headersSent) {
                res.writeHead(200, {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                });
                res.end(JSON.stringify(data || { status: 'ok' }));
              }
            });
            return;
          }
        }

        const chunks = [];
        req.on('data', c => chunks.push(c));

        // Try proxying to backend at port 3010
        const clientReq = http.request({
          hostname: '127.0.0.1',
          port: 3010,
          path: req.url,
          method: req.method,
          headers: req.headers,
        }, (backendRes) => {
          res.writeHead(backendRes.statusCode, backendRes.headers);
          backendRes.pipe(res);
        });

        const respondWithMock = () => {
          let bodyObj = null;
          try {
            const raw = Buffer.concat(chunks).toString('utf8');
            if (raw) bodyObj = JSON.parse(raw);
          } catch {}
          // Backend offline: return mock preview data with 200 OK
          const data = getMockResponse(req.url, req.method, bodyObj);
          if (!res.headersSent) {
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Credentials': 'true',
            });
            res.end(JSON.stringify(data));
          }
        };

        clientReq.setTimeout(1500, () => {
          clientReq.destroy();
          respondWithMock();
        });

        clientReq.on('error', (err) => {
          clientReq.destroy();
          if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
            respondWithMock();
          } else {
            next(err);
          }
        });

        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
          req.pipe(clientReq);
        } else {
          clientReq.end();
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), mockApiPlugin()],
  server: {
    host: '0.0.0.0',
    port: 8080,
  },
});
