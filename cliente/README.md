# Aetherion Online — cliente Fase 1

Protótipo local Phaser 3 + TypeScript + Vite. Esta fase contém apenas movimentação, colisão com cenário e câmera; ainda não há backend/multiplayer.

## Requisitos

- Node.js 20+ e npm.

## Executar

```bash
cd cliente
npm install
npm run dev
```

Abra o endereço local mostrado pelo Vite. Controles: WASD ou setas. O personagem move-se no cenário de Sylvaren; árvores e pedras são obstáculos.

## Verificação de build

```bash
npm run build
```

Pixel rendering é configurado no bootstrap Phaser com `pixelArt: true`, `roundPixels: true`, `antialias: false` e `antialiasGL: false`. A resolução lógica é 640×360; em telas 1280×720 e 1920×1080 isso corresponde a escala 2× e 3×, respectivamente, com `FIT` para preservar proporção. O canvas usa `image-rendering: pixelated`; em dimensões que não sejam múltiplos inteiros, o navegador usa nearest-neighbor (sem interpolação borrada), embora a distribuição dos pixels possa variar levemente. Assets fonte ficam em `/assets` na raiz e são servidos pelo Vite a partir de `cliente/public/assets` (sincronizados por script de desenvolvimento/build).
