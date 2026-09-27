import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import fs from 'node:fs';
import path from 'node:path';

// Geliştirmede: çizgi roman hikâyesinin kareleri video/kareler/ klasörüne yazılır (ffmpeg ile mp4 yapılır)
const frameSaver = {
  name: 'kare-kaydet',
  configureServer(server) {
    server.middlewares.use('/__frame', (req, res) => {
      const dir = path.resolve('video/kareler');
      const i = new URL(req.url, 'http://x').searchParams.get('i');
      if (i === '0') fs.rmSync(dir, { recursive: true, force: true });
      fs.mkdirSync(dir, { recursive: true });
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', () => {
        if (i != null) fs.writeFileSync(path.join(dir, `k${String(i).padStart(5, '0')}.jpg`), Buffer.concat(chunks));
        res.end('ok');
      });
    });
  },
};

// build: her şeyi tek HTML'e gömer, çift tıklayınca (file://) da çalışır
export default defineConfig({ plugins: [viteSingleFile(), frameSaver] });
