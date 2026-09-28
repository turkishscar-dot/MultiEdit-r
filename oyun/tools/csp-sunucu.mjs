// claude.ai yayınına benzer sıkı güvenlik kuralıyla (data: ve blob: yok) dist-web'i sunar: node tools/csp-sunucu.mjs [port]
import http from 'http';
import fs from 'fs';
import path from 'path';
const port = +(process.argv[2] || 4190), root = path.resolve('dist-web');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.txt': 'text/plain', '.mp3': 'audio/mpeg' };
http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]) === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self'; img-src 'self'; media-src 'self'" });
  fs.createReadStream(p).pipe(res);
}).listen(port, () => console.log('CSP sunucu', port));
