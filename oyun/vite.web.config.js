import { defineConfig } from 'vite';
// Telefonda açmak için web sürümü: tek dosya değil, modeller ve sesler ayrı dosya (tarayıcı önbelleğe alır).
// npm run build:web → dist-web/ (göreli yollar: herhangi bir klasörden ya da barındırmadan çalışır)
export default defineConfig({ base: './', build: { outDir: 'dist-web', assetsInlineLimit: 0, chunkSizeWarningLimit: 4000 } });
