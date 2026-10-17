import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const projectDir = fileURLToPath(new URL('.', import.meta.url));
const source = resolve(projectDir, '../assets');
const target = resolve(projectDir, 'public/assets');

function copyAssets(): void {
  if (!existsSync(source)) return;
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

function syncGameAssets(): Plugin {
  return {
    name: 'sync-game-assets',
    buildStart: copyAssets,
    configureServer(server) {
      copyAssets();
      server.watcher.add(source);
      server.watcher.on('change', (changed) => {
        if (changed.startsWith(source)) {
          copyAssets();
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [syncGameAssets()],
  server: { host: '0.0.0.0', allowedHosts: true },
});
