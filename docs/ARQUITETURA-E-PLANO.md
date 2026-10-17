# Aetherion Online — Arquitetura técnica e plano de desenvolvimento

**Status:** proposta para aprovação — nenhuma implementação de jogo iniciada  
**Escopo deste documento:** arquitetura, decisões técnicas e fases incrementais. A próxima etapa só começa após aprovação explícita.

## 1. Visão e princípios

Aetherion Online será um RPG 2D online para Windows, com cliente renderizado em Phaser 3/TypeScript e servidor autoritativo. A arte será pixel art HD: sprites e tiles desenhados em resolução nativa apropriada (64×64 a 128×128 como referência), sem modelos 3D, com renderização pixel-perfect e apresentação em Full HD. Iluminação, sombras, neblina e partículas serão efeitos 2D; os efeitos devem preservar a leitura dos pixels e permitir configuração de desempenho.

Princípios arquiteturais:

- **Servidor é autoridade:** cliente envia intenção (movimento, ataque, uso de item); servidor valida estado, alcance, cooldowns, dano, drops, Zen e persistência. O cliente não decide resultados econômicos ou de combate.
- **Entrega vertical e testável:** cada fase termina com um incremento demonstrável, critérios de aceite e testes correspondentes.
- **Separação de responsabilidades:** cliente, servidor, ferramentas de conteúdo e instalador têm limites explícitos; contratos compartilhados são versionados.
- **Evolução sem prematuridade:** começar simples em monorepo. Redis, escalabilidade horizontal, trade e auto-update entram quando houver necessidade e testes para sustentá-los.
- **Conteúdo orientado a dados:** regiões, mobs, itens, tabelas de drop, quests e progressão devem migrar gradualmente para definições validadas, evitando lógica duplicada e valores soltos no código.

## 2. Stack proposta e decisões

| Camada | Proposta | Responsabilidade |
|---|---|---|
| Cliente | Phaser 3 + TypeScript + Vite | Renderização 2D, controles, HUD, efeitos e apresentação de estado recebido do servidor. Fase 1 roda no navegador. |
| Comunicação | Socket.IO sobre WebSocket + HTTPS/REST | Eventos em tempo real (sessão, movimento, combate e chat) e API para autenticação, perfil e operações que não exigem tempo real. |
| Backend | Node.js + TypeScript + Express | API, autenticação, validações, simulação de jogo, autorização e gateway em tempo real. |
| Persistência | PostgreSQL | Contas, personagens, progresso, inventário, quests, economia, configurações e auditoria relevante. |
| Cache/sessões | Redis, fase posterior | Sessões distribuídas, presença, rate limits e estado efêmero quando o servidor evoluir para múltiplas instâncias. Não é dependência do protótipo local. |
| Desktop | Electron, recomendação inicial | Empacotamento do cliente web e integração com instalador/atualizações. |
| Instalador | electron-builder (NSIS para Windows) | Instalador, escolha de diretório, atalhos, desinstalação e publicação de artefatos. |

### Electron versus Tauri

**Recomendação: Electron para a primeira entrega desktop.** Phaser já roda em Chromium; Electron empacota esse ambiente de forma previsível, tem ecossistema maduro para jogos/web apps, integração simples com electron-builder/NSIS e fluxo conhecido de atualização. O custo é um instalador maior e maior consumo de memória por incluir Chromium e Node.

**Tauri** tende a gerar pacotes menores e consumir menos recursos, pois utiliza WebView do sistema e componentes nativos em Rust. Em contrapartida, depende da WebView instalada/atualizada no Windows e exige integração Rust e validação adicional de compatibilidade de recursos gráficos, plugins e atualização. É uma alternativa válida se tamanho do pacote e footprint forem prioridades fortes; pode ser reavaliada com um protótipo antes da fase desktop.

### Rede e autoridade

Socket.IO é recomendado inicialmente por reconexão, salas e fallback operacional convenientes. O protocolo deve ser independente da implementação: eventos tipados e versionados, validação de payload no servidor, limites de frequência, IDs idempotentes quando necessário e mensagens de erro previsíveis. Para latência e escala muito maiores, `ws` pode ser avaliado depois com benchmark real.

No mundo online, o servidor mantém estado de sessão e simula entidades relevantes. O cliente renderiza interpolando snapshots/eventos e prevê apenas movimento visual quando seguro; o servidor corrige a posição. Nunca confiar em XP, Zen, inventário, posição final de ataque, chance de craft ou resultado de PvP declarados pelo cliente.

## 3. Estrutura detalhada do repositório

Monorepo com limites explícitos. Os diretórios de servidor e installer existem desde o início, mas seus módulos serão implementados somente nas fases indicadas. A árvore abaixo é o destino planejado; arquivos/módulos não são alegação de que já estejam implementados.

```text
/
├── cliente/
│   ├── src/
│   │   ├── app/                 # bootstrap Phaser, config, escala e ciclo da aplicação
│   │   ├── scenes/              # Boot, Preload, Menu, World e overlays
│   │   ├── world/               # tilemaps, regiões, câmera, colisões e transições
│   │   ├── entities/            # renderizadores/apresentação de player, NPC e mobs
│   │   ├── animation/           # carregamento de manifestos e seleção de animações
│   │   ├── input/               # teclado/gamepad, bindings e comandos locais
│   │   ├── ui/                  # HUD, inventário, status, skills, quests, chat e tooltips
│   │   ├── effects/             # partículas, fog, luzes e feedback visual 2D
│   │   ├── audio/               # mixer, música, efeitos e preferências
│   │   ├── net/                 # Socket.IO client, reconexão, snapshots (fase online)
│   │   ├── state/               # estado de apresentação/cache; sem autoridade econômica
│   │   └── config/              # configuração por ambiente e flags de recurso
│   ├── public/assets/           # cópia/build dos assets que o cliente carrega
│   ├── tests/                   # testes unitários e de integração de cliente
│   └── index.html               # shell web servido em desenvolvimento/build
├── servidor/
│   ├── src/
│   │   ├── bootstrap/           # inicialização, config e encerramento gracioso
│   │   ├── api/                 # Express REST, rotas, DTOs e validação
│   │   ├── auth/                # cadastro/login, tokens, sessão e autorização
│   │   ├── realtime/             # Socket.IO, salas, handlers e protocolo
│   │   ├── simulation/           # tick, movimento, entidades e sincronização
│   │   ├── game/                 # combate, XP, atributos, drops, inventário e crafting
│   │   ├── quests/               # estado, objetivos e recompensas autoritativas
│   │   ├── economy/              # Zen, vendors e operações transacionais
│   │   ├── pvp/                  # zonas, duelos e ranking (fase PvP)
│   │   ├── world/                # regiões, instâncias, portais e regras de zona
│   │   ├── content/              # definições validadas de itens, mobs, receitas e quests
│   │   ├── persistence/          # PostgreSQL, repositórios, transações e migrações
│   │   ├── cache/                # Redis opcional para sessão/presença/cache
│   │   ├── security/             # schemas, rate limit, anti-abuso e auditoria
│   │   └── observability/        # logs estruturados, métricas e health checks
│   ├── tests/                    # unit, integração, segurança e carga
│   └── migrations/               # migrações versionadas de banco
├── shared/
│   ├── protocol/                 # envelopes/eventos e versionamento cliente-servidor
│   ├── schemas/                  # schemas de payload/conteúdo para validação
│   ├── types/                    # tipos TS serializáveis compartilhados
│   ├── constants/                # enums e limites não secretos
│   └── tests/                    # compatibilidade de contratos
├── installer/
│   ├── electron/                 # main process, preload com API mínima e janela
│   ├── packaging/                # configuração de electron-builder/NSIS, ícones e licença
│   ├── updater/                  # canal, verificação e tratamento de atualização
│   ├── config/                   # endpoints por canal (sem segredo embutido)
│   └── tests/                    # smoke tests de instalação/atualização
├── assets/                       # fonte dos recursos visuais/sonoros e convenções
│   ├── characters/<id>/manifest.json
│   ├── npc/<id>/manifest.json
│   ├── mobs/<regiao>/<id>/manifest.json
│   ├── tilesets/<regiao>/
│   ├── items/  ├── ui/  ├── effects/  ├── audio/
│   └── style-guide/style-guide.md
├── docs/                          # arquitetura, decisões, design e operação
├── tools/                         # validação, importação e empacotamento de conteúdo
└── README.md
```

`assets/` é a fonte organizada por tipo; o cliente poderá copiar/otimizar os recursos para `cliente/public/assets` no build sem duplicar a fonte editável no repositório. Cada pasta de entidade (personagem, NPC ou mob) inclui `manifest.json` com dimensões, animações, frames e pivô. Antes de criação em lote, validar convenção e tamanhos na Fase 1. `shared/` não contém regras de jogo autoritativas; o servidor valida qualquer valor recebido do cliente. Módulos aparecem progressivamente conforme cada fase, sem implementação antecipada.

## 4. Domínios e fronteiras do jogo

- **Personagem e progressão:** classes Arqueiro Élfico, Mago da Natureza, Guerreiro Sombrio e Druida; Força, Agilidade, Inteligência, Vitalidade e Energia. O servidor define curva de XP, pontos por nível e valida distribuição/reset de atributos.
- **Mundo:** regiões com nível recomendado, clima/paleta, mobs, pontos de interesse, NPCs, vendors, dungeons e portais. Fast travel só para destinos desbloqueados. Zonas definem regras de segurança/PvP.
- **Combate e entidades:** atributos e habilidades determinam resultados no servidor; cliente apresenta animações e feedback. Mobs e drops usam tabelas de conteúdo versionadas.
- **Itens e inventário:** itens identificados por instância e definição; raridades Normal, Excelente, Raro e Ancestral/Lendário; slots: capacete, armadura, luvas, botas, arma, escudo, anéis, amuleto e asas. Operações de equipar, mover, vender e consumir são validadas no servidor.
- **Craft/combinação:** receitas e custos em conteúdo; a máquina de combinação debita materiais/Zen e sorteia resultado exclusivamente no servidor, registrando resultado para auditoria.
- **Quests:** estado por personagem, pré-requisitos, objetivos e recompensas validados no servidor; história principal élfica e tarefas secundárias.
- **Economia:** Zen como moeda persistente; vendors com preços/regras no servidor. Trade entre jogadores explicitamente fora do primeiro escopo online e sujeito a controles contra duplicação.
- **PvP:** duelo consentido em área segura e combate aberto apenas nas zonas configuradas; ranking calculado pelo servidor. Regras de penalidade, desconexão e exploração precisam ser definidas antes da fase PvP.
- **Interface:** HUD (vida/mana, minimapa, skills, chat, log de quests), telas de inventário/status e tooltips comparativos. UI é apresentação, nunca fonte de verdade.

## 5. Dados, segurança e operação

Entidades persistentes previstas: conta, personagem, progresso/atributos, inventário/equipamentos, moedas, estado de quest e desbloqueios. Esquema definitivo será desenhado na fase de backend; migrações serão versionadas e testadas. Transações PostgreSQL devem proteger operações que alteram Zen e itens. Redis será opcional e não substituirá a fonte persistente.

Controles mínimos antes de abrir multiplayer: validação de esquema de toda mensagem, autenticação e autorização por personagem, rate limit, limites de movimento/ataque, cooldowns no servidor, proteção contra replay/duplicação, logs operacionais sem segredos, backups e tratamento de reconexão. HTTPS/WSS, gestão de segredos fora do repositório e ambiente de staging são requisitos de deploy. Anti-cheat será básico e progressivo; não há promessa de impedir clientes modificados, mas o servidor rejeita estados impossíveis.

O instalador e auto-update são fases finais. Atualizações devem usar artefatos assinados, canal/versionamento, validação de integridade e plano de rollback. A distribuição pública também exige hospedagem, domínio, certificados, monitoramento e política de backup — itens operacionais a decidir antes do lançamento.

## 6. Plano de desenvolvimento por fases

Cada fase deve ser aprovada/revisada pelo usuário antes de iniciar a próxima. O escopo pode ser refinado, mas nenhuma fase deve ser considerada concluída sem seus critérios de aceite.

### Fase 1 — Setup e protótipo local no navegador (proposta imediata)

**Escopo:** setup do projeto Phaser 3 + TypeScript, tela/cena inicial, personagem placeholder em pixel art, tileset de cenário, movimento por teclado, colisões simples e câmera seguindo o personagem. Rodar localmente no navegador. Organizar desde já `/cliente`, `/servidor` e `/installer`; backend e installer ficam sem implementação.

**Aceite:** comando documentado inicia o cliente local; personagem move-se nos eixos sem atravessar tiles sólidos; câmera acompanha sem sair dos limites do mapa; renderização sem blur (pixel art); layout funciona em janela de navegador Full HD; console sem erros relevantes. Teste manual reproduzível e build de produção do cliente.

**Fora de escopo:** login, servidor, banco, multiplayer, conteúdo final, combate, arte final e Electron.

### Fase 2 — Fundação visual e controles

Pipeline inicial de assets, escala/resolução, animações básicas, teclado configurável, limites de mapa e cenas. Definir convenções de tilemap e guia visual. **Aceite:** mapa de teste consistente, animações legíveis e parâmetros de renderização documentados.

### Fase 3 — Vertical slice de personagem e combate PvE local

Classes iniciais configuráveis, atributos, vida/mana, ataque e uma habilidade, mobs com comportamento básico, XP e subida de nível com pontos de status. Simulação temporária local, preparada para substituição pela autoridade do servidor. **Aceite:** ciclo matar mob → ganhar XP → subir nível → distribuir pontos funcional e testável.

### Fase 4 — Itens, inventário e drops

Definições de itens, raridades, slots, grid, arrastar/soltar, equipar, tooltip comparativo e drops determinísticos/configuráveis para testes. **Aceite:** itens podem ser obtidos, movidos e equipados sem perda/duplicação no fluxo local; atributos equipados refletem corretamente.

### Fase 5 — Conteúdo e progressão solo de protótipo

Primeiras regiões e identidade visual (Sylvaren como região inicial), mobs, NPCs, vendors locais, quests principais/secundárias, Zen, fast travel demonstrativo. **Aceite:** pequena jornada de início a objetivo de quest com recompensa e economia local.

### Fase 6 — Craft, combinação e polimento de sistemas

Receitas de materiais e combinação tipo Chaos Machine com custo, sucesso/falha e feedback; balanceamento preliminar e ferramentas de validação de conteúdo. **Aceite:** receitas inválidas são rejeitadas e recursos debitados/resultado aplicados de forma consistente no protótipo.

### Fase 7 — Backend online e persistência

Criar servidor Node/TypeScript, Express, Socket.IO e PostgreSQL; autenticação, contas/personagens, migrações, contratos compartilhados, sessões e sincronização inicial de movimento. Usar ambientes local/staging. Redis só quando necessário para sessão/presença distribuída. **Aceite:** dois clientes autenticados veem movimento sincronizado; reiniciar servidor preserva dados; testes confirmam que cliente não pode forjar posição/progresso básicos.

### Fase 8 — Autoridade de jogo e multiplayer PvE

Mover progressão, combate, loot, inventário, quests, craft e economia para regras autoritativas no servidor; reconexão, validação, logs e controles anti-abuso. **Aceite:** dois jogadores compartilham região; resultados de combate/drops/Zen são decididos no servidor e persistem corretamente.

### Fase 9 — PvP, ranking e economia multiplayer

Duelo, zonas PvP, regras de morte/penalidade a definir, ranking e controles para operações econômicas. Trade entre jogadores permanece opcional e fora de escopo até auditoria/segurança. **Aceite:** regras são aplicadas e testadas no servidor, sem PvP em zonas seguras e com ranking reproduzível.

### Fase 10 — Conteúdo, balanceamento e beta fechado

Expandir regiões, quests, itens, mobs, efeitos 2D, áudio e otimização; testes de carga e playtests; telemetria mínima respeitando privacidade; staging e procedimentos de suporte/backup. **Aceite:** campanha de teste e checklist de estabilidade aprovados antes de empacotar.

### Fase 11 — Cliente desktop e instalador Windows

Integrar Electron, empacotar cliente, construir instalador NSIS com boas-vindas, escolha de pasta, atalhos e desinstalador; configurar identidade e assinatura do aplicativo. **Aceite:** instalação, execução, atualização de configuração e desinstalação testadas em Windows limpo/VM, com conexão ao servidor remoto configurado.

### Fase 12 — Auto-update e deploy de lançamento

Publicar canal de atualização seguro, artefatos assinados e verificados, rollback, servidor em produção, TLS, monitoramento, alertas, backups e recuperação. Testar atualização incremental/versão nova e falhas de rede. **Aceite:** instalador novo conecta ao ambiente de produção; atualização válida instala sem perda de dados e versão inválida/falha é tratada com segurança.

## 7. Riscos e decisões pendentes

1. **Escopo:** MMORPG completo é projeto extenso; lançar uma vertical slice antes de expandir reduz risco de construir sistemas incompatíveis.
2. **Arte:** pixel art HD exige pipeline e consistência de escala; assets finais devem ser produzidos/licenciados com direitos de uso claros. Placeholder da Fase 1 não representa a qualidade final.
3. **Rede e operação:** multiplayer real implica custo contínuo de hospedagem, observabilidade, segurança e suporte; capacidade e orçamento ainda não definidos.
4. **PvP/economia:** regras de perda, proteção contra abuso, inflação, trade e ranking precisam de decisões de design antes das fases correspondentes.
5. **Distribuição:** assinatura de código e publicação do auto-update dependem de certificados, serviço de distribuição e infraestrutura, a contratar/configurar perto do deploy.
6. **Compatibilidade:** validar cedo resolução, desempenho e comportamento em computadores Windows modestos; Full HD é alvo visual, não garantia automática de desempenho.

## 8. Gate de aprovação

A próxima ação, somente após aprovação, é executar **apenas a Fase 1**: preparar a estrutura mínima e entregar o protótipo local no navegador com personagem andando em tileset e câmera seguindo. Nenhum sistema online, installer ou fase seguinte será iniciado sem nova revisão do escopo e autorização.
