# Aetherion Online — Guia de estilo visual (v0.1)

**Status:** especificação inicial para aprovação; nenhum sprite foi criado.  
**Objetivo:** manter leitura clara e consistência entre personagens, criaturas, cenários e efeitos em pixel art HD 2D, sem modelos 3D.

## Direção de arte

Fantasia élfica com natureza ancestral, ruínas antigas e corrupção mágica. Silhuetas devem ser identificáveis em movimento e em escala de jogo. A riqueza visual vem de clusters de pixels, materiais bem diferenciados, paleta controlada e iluminação 2D; evitar ruído de pixels, gradientes borrados e excesso de detalhe que prejudique a leitura.

## Paleta de referência

Cores HEX são âncoras e podem variar por material/região. Cada sprite deve usar uma seleção limitada e coerente; não é necessário usar todas as cores.

| Uso | Nome | HEX |
|---|---|---|
| Folhagem escura / contorno verde | Evergreen | `#18352E` |
| Folhagem base | Sylvan | `#2F6B4F` |
| Folhagem iluminada | Moss | `#78A85A` |
| Luz de folha / magia natural | Luminous Leaf | `#B8D879` |
| Pedra fria escura | Ruin Slate | `#343C50` |
| Pedra média | Moonstone | `#68758A` |
| Pedra clara | Pale Stone | `#B8C3C8` |
| Madeira / couro | Bark | `#674538` |
| Madeira iluminada | Amberwood | `#B47A4C` |
| Pele clara | Warm Ivory | `#E8C9A0` |
| Pele sombra | Umber | `#9B654F` |
| Metal base | Silver | `#AEBBC6` |
| Metal sombra | Blue Steel | `#596D80` |
| Ouro / Zen | Aether Gold | `#E7B84B` |
| Magia arcana | Aether Cyan | `#65DCE8` |
| Magia élfica | Spirit Violet | `#A98BE8` |
| Corrupção | Blight | `#9B4F86` |
| Brasa / alerta | Ember | `#E87952` |
| UI fundo | Night Ink | `#171D2B` |
| UI superfície | Deep Slate | `#293449` |
| UI texto principal | Ivory | `#F1EBD9` |

**Regras de paleta:** regiões podem adicionar cores locais, mantendo contraste de valor entre figura e fundo. Use temperaturas de cor distintas para materiais (pele, couro, metal, vegetação). Efeitos mágicos podem ser mais saturados que o mundo, mas devem ter centro/luz e borda/atenuação legíveis. A paleta será revisada com protótipos, considerando acessibilidade e daltonismo.

## Resoluções e escala de produção

Unidades abaixo são pixels de arte nativa (não tamanho final de exibição). Referência de mapa: tiles-base 32×32 ou 64×64; escolher um padrão na Fase 1 e manter múltiplos inteiros. A resolução de 64×64 a 128×128 citada para sprites é faixa de densidade/área, não obrigação de enquadrar todas as silhuetas em quadrado.

| Categoria | Caixa de referência | Orientação |
|---|---:|---|
| Personagem jogável | 64×96 px por frame; variações maiores até 96×128 | Silhueta e equipamento legíveis; manter proporção entre classes e pivô consistente. |
| NPC humanoide | 64×96 px por frame; importante até 96×128 | Base compartilhada quando aplicável; detalhes de identidade sem competir com jogador. |
| Mob comum | 64×64 px ou 96×96 px por frame | Leitura imediata por silhueta; pequenos até 64×64, criaturas largas até 128×96. |
| Mob elite | 96×96 a 128×128 px por frame | Mais detalhe e efeito distintivo, mantendo clareza de ataque. |
| Chefe | 128×128 px como mínimo de referência; grande até 192×192 ou frames compostos | Presença visual; ataques telegráficos claros; validar custo de memória e enquadramento. |
| Itens/ícones | 32×32 ou 64×64 px | Silhueta forte e leitura em UI; variantes de raridade não dependem só da cor. |
| Tiles | 32×32 ou 64×64 px | Tile grid coerente; detalhes conectáveis em bordas e autotiling documentado. |
| Efeitos | 32×32 a 128×128 px por frame | Resolução conforme escala; atlas separado quando indicado. |

Assets devem ser exibidos por escala inteira sempre que possível e com `pixelArt`/filtro nearest-neighbor habilitado. Escalonamento fracionário só com validação visual, sem suavização automática. As dimensões são metas iniciais, a validar na Fase 1 antes de produção em lote.

## Contorno, forma e sombreamento

- Contornos externos seletivos, em geral 1–2 pixels nativos conforme escala. Preferir contorno colorido escuro relacionado ao material, não preto puro universal.
- Evitar contorno uniforme em todas as bordas: variar espessura para profundidade, luz e materiais; preservar silhueta contra fundos claros e escuros.
- Sombreamento padrão em 3–5 níveis por material: sombra profunda, sombra, base, luz e highlight opcional. Agrupar pixels em clusters intencionais; evitar dithering como preenchimento genérico.
- Definir uma direção principal de luz por cena (padrão: superior esquerdo) e manter consistência em personagens, tiles e props. Luzes mágicas podem introduzir iluminação local 2D sem quebrar a leitura da luz base.
- Usar sombras projetadas simples em camada separada quando necessário; iluminação dinâmica e fog são efeitos 2D com opção de qualidade/desativação.
- Animações devem preservar volume, pivô e proporção; sem jitter de contorno entre frames. Armas, asas e acessórios podem ter camadas/offset próprios quando o pipeline suportar.
- Telegráficos de combate priorizam contraste e antecipação. Não usar apenas matiz para comunicar raridade, dano ou estado.

## Animação e exportação

Animações devem ter nomes estáveis e ciclos com frame rate definido por sequência. Direções: `south`, `north`, `west`, `east` (oeste/leste podem espelhar-se se a arte permitir). Cada manifest declara tamanho de frame, lista de frames por animação, duração/FPS, pivô e caixa de colisão lógica quando pertinente. Atlas e PNG sem perdas; conservar a imagem-fonte editável fora do build final quando disponível. Não inserir fundo opaco em sprites que precisam de transparência.

## Revisão de assets

Checklist: transparência correta; dimensões e pivô documentados; silhueta legível em tamanho de jogo; paleta coerente; frames sem jitter; sem suavização; desempenho de atlas validado; licença e origem registradas. Alterações de estilo devem atualizar este arquivo e a versão dos manifests.
