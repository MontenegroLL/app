### [Sessão 012] — 2026-10-19 (Remote GitHub + Renovate + CodeQL)
- **Agente**: opencode (Implementador — CI/Segurança)
- **Objetivo**: Configurar o remote GitHub e adicionar Renovate + CodeQL conforme o recon open-source.
- **Entregáveis & Evidências**:
  1. **Remote configurado**: `origin` → `https://github.com/MontenegroLL/app.git`. **Push realizado com sucesso** (`git ls-remote` confirma `refs/heads/main` = `8d51aca`; local rastreando `origin/main`, tree limpo).
  2. **Renovate** (`renovate.json`): grupos (Medusa, React, Lint & Format, Testing), agendamento semanal, lockFileMaintenance mensal, alertas de vulnerabilidade, major sem automerge.
  3. **CodeQL** (`.github/workflows/codeql.yml`): JavaScript/TypeScript, queries `security-extended`, build automático + varredura semanal (cron segunda 06:00 UTC).
  4. Workflows validados (YAML) — total agora: `ci.yml`, `quality.yml`, `security.yml`, `codeql.yml`.
- **Estado do Sistema**:
  - Working tree limpo; **8 commits** na `main`, **sincronizados com `origin/main`**.
  - Builds/typechecks permanecem verdes (0 erros) — nenhuma alteração de código de app nesta sessão (só CI/config).
- **⚠️ Ponto de atenção crítico (verificar no GitHub)**:
  - O repositório parece **privado** (API retornou 403). **CodeQL em repo privado exige GitHub Advanced Security (pago)**; em repo **público é gratuito**. Se o repo for privado, `codeql.yml` falhará no upload de resultados — avaliar tornar público ou habilitar GHAS.
  - Verificar na aba **Actions** se `security.yml` (gitleaks) passou no primeiro push.
- **Handoff para o Próximo Agente**:
  - Conferir os runs em https://github.com/MontenegroLL/app/actions.
  - Iniciar **Renovate** (instalar o app em github.com/apps/renovate) para o `renovate.json` ter efeito.
  - Próximos itens do recon: suíte de testes (vitest + playwright), workaround Supabase (2 URLs), PoC `@medusapos/medusa-plugin`.

### [Sessão 011] — 2026-10-19 (Higiene + Ferramentas Base: Git, Biome, Husky, gitleaks, env, Changesets)
- **Agente**: opencode (Implementador — Higiene & DX)
- **Objetivo**: Aplicar as recomendações de higiene de repositório e ferramentas base do recon open-source.
- **Entregáveis & Evidências**:
  1. **Higiene**: segredos em texto puro movidos para `%USERPROFILE%\nucleo-secrets\` (fora do workspace; nada apagado). `.gitignore` reforçado + `.gitattributes` (LF).
  2. **Git**: repositório inicializado em `nucleo-pdv/` (branch `main`). Commit inicial com 405 arquivos (dry-run confirmou: nenhum `.env`/`node_modules`/`.medusa`/segredo entrou).
  3. **Biome 2.5.15** (`semi: false`, double quotes; `.agents/` excluído), aplicado em 300 arquivos. Husky + lint-staged no pre-commit.
  4. **gitleaks** no CI (`.gitleaks.toml` + `.github/workflows/security.yml`).
  5. **Env validado**: storefront com t3-env (`moduleResolution` → `bundler`); backend com Zod (CJS-safe). Runtime testado (rejeita valores inválidos).
  6. **Changesets v2** + **CI** (`ci.yml`, `quality.yml`).
- **Estado do Sistema (verificado)**: `yarn tsc --noEmit` 0 erros (backend e storefront); `yarn build` exit 0 em ambos; working tree limpo; 5 commits na `main`. Débito de lint legado: 98 erros (a11y do starter), não bloqueante.
- **Handoff**: reduzir débito de lint incrementalmente e tornar Biome bloqueante; configurar remote GitHub; seguir com Renovate + CodeQL e PoC do `@medusapos/medusa-plugin`. **O repo git fica em `nucleo-pdv/`.**

---


- **Agente**: opencode (Implementador - Admin v2)
- **Objetivo**: Expor a gestão do Food Service no Medusa Admin (rotas `/admin/restaurant/*` + páginas "Salão & Mesas" e "Modificadores" no menu lateral).
- **Entregáveis & Evidências**:
  1. Rotas admin: `GET/POST /admin/restaurant/tables` (lista com `active_tab` das comandas abertas, ordenação numérica; criação valida nome/capacidade/status e gera `qr_code_token`), `GET/PUT /admin/restaurant/tables/:id`, `GET /admin/restaurant/tables/:id/qr-code` (`target_url` `/mesa/<token>` + `data_url` PNG base64 via `qrcode`), `GET/POST /admin/restaurant/modifier-groups`, `GET/PUT /admin/restaurant/modifier-groups/:id` e `POST /admin/restaurant/modifier-groups/:id/modifiers`.
  2. UI Admin (`src/admin`): `routes/tables/page.tsx`, `routes/modifiers/page.tsx`, `lib/restaurant-api.ts` e `styles/global.css` (`--brand-color` fallback `#E53935`).
    - Evidência: `src/scripts/verify-admin-restaurant-routes.ts` → **21/21 PASS** (`ADMIN_ROUTES_FAILURES=0 VERIFICATION_SUCCESS`), com cleanup automático.
- **Estado do Sistema**:
  - `yarn tsc --noEmit`: **0 erros**; `yarn medusa build`: backend + admin OK; `yarn medusa lint`: **0 erros / 23 warnings** (preexistentes).
  - Bundle `.medusa/server/public/admin/assets/index-*.js` contém `/admin/restaurant/tables` e `nucleo-restaurant-tables` (menu lateral registrado).
- **Handoff para o Próximo Agente**:
  - Validação visual em `http://localhost:9000/app` pendente (subir `yarn medusa develop`; conferir menu "Salão & Mesas"/"Modificadores" e troca de status).
  - Prosseguir com **Fase 2**: API de Contas Abertas (transferência entre mesas, split payment) e PDV Touch (PWA).

---

### [Sessão 006] — 2026-10-18 (Etapa 1.5 - Extensão do Carrinho)
- **Agente**: opencode (Implementador - Etapa 1.5)
- **Objetivo**: Estender o carrinho com modificadores, mesas e comandas (rotas store + hooks de validação + preço real).
- **Entregáveis**:
  1. Hooks de validação (consumidos pelos loaders de `src/workflows`):
     - `src/workflows/hooks/create-cart.ts`: valida `metadata.table_id`/`tab_id` (mesa existe e status `available`/`occupied`/`reserved`; comanda `open` e pertencente à mesa).
     - `src/workflows/hooks/add-to-cart.ts`: valida modificadores (existência, grupo, vínculo grupo→produto, `max_quantity`, `min_selection`/`max_selection` e grupos `is_required`).
  2. Rotas store:
     - `GET /store/restaurant/modifier-groups?product_id=` (grupos + modificadores).
     - `GET /store/restaurant/tables/:token` (mesa por `qr_code_token` + comanda aberta).
     - `POST /store/restaurant/tabs` (abre comanda; idempotente; mesa → `occupied`).
     - `POST /store/restaurant/tabs/:id/close` (fecha comanda; mesa → `billing`).
     - `POST /store/carts/:id/restaurant-items` (calcula `unit_price` = preço da variante + Σ modificadores via `Modules.PRICING.calculatePrices`, grava modificadores em `items.metadata` e roda `addToCartWorkflow`).
  3. `seed-food-service.ts` endurecido para reexecução: lookup de tags por `value`, `manage_inventory: false` nas variantes, `ModifierGroup.product_id` vinculado ao produto e `qr_code_token` da Mesa 01.
  4. Script de verificação `src/scripts/verify-cart-flow.ts` (executa handlers das rotas com mocks): **18/18 PASS**.
- **Estado do Sistema**:
  - `yarn tsc --noEmit` em `apps/backend`: **0 erros**.
  - Validação end-to-end: preço do item `4700` (4500 base + 200 Catupiry) e **persistência confirmada** após `refreshCartItemsWorkflow` (risco de reset de `unit_price` por promoções afastado).
  - Bloqueios testados: mesa inexistente, token inexistente, >max_selection, modificador inexistente, grupo obrigatório ausente, carrinho inexistente, fechar comanda já fechada.
  - Nenhuma migration nova (metadata do cart/line item já é `jsonb` nativo).
- **Handoff para o Próximo Agente**:
  - Fase 1 concluída. Próximo: **Fase 2 — API de Contas Abertas** (adicionar/transferir itens entre mesas, split payment) e o PDV Touch (PWA).
  - Atenção: adicionar itens de produtos com `is_required` agora exige modificadores em qualquer chamada de `addToCartWorkflow`.

---
### [Sessão 005] — 2026-10-17 23:15
- **Agente**: Antigravity Lead AI (Implementador - Etapa 1.4)
- **Objetivo**: Seed de produção do cardápio Food Service e validação de inserção de dados.
- **Entregáveis**:
  1. Criado `apps/backend/src/scripts/seed-food-service.ts` (exec via `medusa exec`), idempotente: pula registros já existentes.
  2. Seed executado com sucesso (`FOOD_SERVICE_SEED_DONE`):
     - Coleção `Pizzas` e tags `pizza`/`calabresa`/`bordas`.
     - Produto `Pizza Calabresa` (publicado, BRL) com opção **Borda** (variantes Catupiry R,00 e Cheddar R,00).
     - `RestaurantTable` **Mesa 01** (capacidade 4, disponível).
     - `ModifierGroup` **Bordas** (min 1, max 1, obrigatório) com `Modifier` **Catupiry** e **Cheddar** (R,00 cada, price em centavos).
  3. Validação via `verify-restaurant-module.ts` após o seed:
     - `RESTAURANT_TABLES_COUNT: 1`, `MODIFIER_GROUPS_COUNT: 1`, `MODIFIERS_COUNT: 2`, `TABS_COUNT: 0`.
     - `VERIFICATION_SUCCESS`.
- **Estado do Sistema**:
  - Migration `Migration20261018003642` aplicada no Supabase (tabelas: modifier_group, modifier, restaurant_table, tab).
  - `yarn tsc --noEmit` em apps/backend: **0 erros**.
- **Handoff para o Próximo Agente**:
  - Próxima etapa: extensão do carrinho (metadata de modificadores, `table_id`/`tab_id`) conforme `plans/SPRINT_TRACKER.md`.

---
### [Sessão 004] — 2026-10-17 22:51
- **Agente**: Antigravity Lead AI (Implementador - Food Service)
- **Objetivo**: Criação do módulo estaurant (Medusa v2 DML) e geração de migrations.
- **Entregáveis**:
  1. Modelos DML criados em pps/backend/src/modules/restaurant/models/: ModifierGroup, Modifier, RestaurantTable, Tab com relações (hasMany/belongsTo) e enums de status.
  2. service.ts: RestaurantModuleService estendendo MedusaService com todos os modelos.
  3. index.ts: export do módulo via Module("restaurant", { service: ... }).
  4. medusa-config.ts: módulo estaurant registrado.
  5. Migration gerada: pps/backend/src/modules/restaurant/migrations/Migration20261018003642.ts (tabelas modifier_group, modifier, estaurant_table, 	ab + FKs com cascade).
- **Estado do Sistema**:
  - yarn tsc --noEmit em pps/backend executado com **0 erros**.
  - Migrations geradas; aplicação no Supabase pendente/aguardando ambiente de execução (comando db:migrate iniciado em background/awaiting connectivity; migration SQL pronta para aplicar).
- **Handoff para o Próximo Agente**:
  - Validar conexão com Supabase e confirmar aplicação da migration Migration20261018003642 (verificar tabelas/constraints no banco). Prosseguir com **Etapa 1.3** (extensão Cart/Order com modificadores e vínculo de mesa/comanda) conforme plans/SPRINT_TRACKER.md.

---
# ðŸ¤ Ambiente de Trabalho & ColaboraÃ§Ã£o Multi-Agente (Multi-Agent Workplace)

Este documento estabelece o **canal central de diÃ¡logo, sincronizaÃ§Ã£o e passagem de bastÃ£o (handoff)** entre todos os agentes de InteligÃªncia Artificial que operam neste monorepo (Antigravity, Cursor, Ollama/Qwen, Claude Code, Copilot, etc.), garantindo que **nÃ£o ocorram desentendimentos, colisÃµes de cÃ³digo ou regressÃµes**.

---

## ðŸ§­ 1. As 4 Regras de ConvivÃªncia entre Agentes

1. **Check-in ObrigatÃ³rio**: Todo agente, ao iniciar uma sessÃ£o de trabalho, DEVE ler este arquivo e registrar uma entrada em [3. Livro de SessÃµes e Passagem de BastÃ£o](#3-livro-de-sessÃµes-e-passagem-de-bastÃ£o-handoff-ledger).
2. **Respeito aos File Locks**: Antes de editar um arquivo, verifique a tabela de [Zonas de Trabalho Ativas](#2-zonas-de-trabalho-ativas-file-locks). NÃ£o modifique arquivos travados por outro agente sem antes coordenar a liberaÃ§Ã£o.
3. **Metodologia Superpowers**: Use as habilidades instaladas em [`.agents/skills/`](../.agents/skills/) para conduzir tarefas complexas (TDD, subagentes paralelos, revisÃ£o de cÃ³digo e verificaÃ§Ã£o).
4. **Handoff Claro no Check-out**: Ao terminar seu turno ou tarefa, registre exatamente o que foi concluÃ­do, o que foi testado e o que o prÃ³ximo agente deve executar.

---

## ðŸ”’ 2. Zonas de Trabalho Ativas (File Locks)

| Zona / MÃ³dulo | Arquivos Principais | Agente ResponsÃ¡vel | Status | Bloqueado? |
| :--- | :--- | :--- | :--- | :--- |
| **MÃ³dulo Restaurant** | `apps/backend/src/modules/restaurant/*` | *Antigravity Lead Agent* | Em Modelagem (Sprint 1) | ðŸ”’ Sim |
| **Hub iFood** | `apps/backend/src/services/ifood.ts`, `jobs/ifood-polling.ts` | *Antigravity Lead Agent* | ConcluÃ­do (Base Ativa) | ðŸ”“ Livre |
| **Storefront White-Label** | `apps/storefront/src/*` | *Aguardando AtribuiÃ§Ã£o* | BRL Travado / EstÃ¡vel | ðŸ”“ Livre |
| **ConfiguraÃ§Ã£o Admin** | `apps/backend/src/admin/*` | *Antigravity Lead Agent* | ConcluÃ­do (Estilos Ocultos) | ðŸ”“ Livre |
| **LogÃ­stica Fleetbase** | *Pendente IntegraÃ§Ã£o* | *Aguardando Fase 4* | Planejado | ðŸ”“ Livre |

---

## ðŸ› ï¸ 3. Ferramentas Integradas (Superpowers Toolkit)

O framework de desenvolvimento **[obra/superpowers](https://github.com/obra/superpowers)** foi importado para [`.agents/skills/`](../.agents/skills/). Todos os agentes tÃªm acesso Ã s seguintes ferramentas:

| Habilidade | Caminho | Quando Usar |
| :--- | :--- | :--- |
| **`subagent-driven-development`** | `.agents/skills/subagent-driven-development/SKILL.md` | Para orquestrar subagentes em tarefas paralelas com contexto isolado. |
| **`test-driven-development`** | `.agents/skills/test-driven-development/SKILL.md` | Para criar testes antes da implementaÃ§Ã£o (red-green-refactor). |
| **`verification-before-completion`**| `.agents/skills/verification-before-completion/SKILL.md` | VerificaÃ§Ã£o rigorosa com compilaÃ§Ã£o e testes antes de dar a tarefa por pronta. |
| **`using-git-worktrees`** | `.agents/skills/using-git-worktrees/SKILL.md` | Para isolar branches em trabalhos concorrentes de mÃºltiplos agentes. |
| **`systematic-debugging`** | `.agents/skills/systematic-debugging/SKILL.md` | Para investigaÃ§Ã£o metÃ³dica de erros de build, banco ou runtime. |
| **`requesting-code-review`** | `.agents/skills/requesting-code-review/SKILL.md` | Para submeter cÃ³digo Ã  revisÃ£o de outro agente antes do merge. |

---

## ðŸ“œ 4. Livro de SessÃµes e Passagem de BastÃ£o (Handoff Ledger)

> **InstruÃ§Ã£o para Agentes**: Adicione uma nova seÃ§Ã£o no topo deste histÃ³rico sempre que concluir uma rodada de trabalho.

### [SessÃ£o 003] â€” 2026-10-17 21:15
- **Agente**: Antigravity Lead AI
- **Objetivo**: CriaÃ§Ã£o do Ambiente de Trabalho Multi-Agente e IntegraÃ§Ã£o do Superpowers Toolkit.
- **EntregÃ¡veis**:
  1. Clonado e integrado o repositÃ³rio `obra/superpowers` em `.agents/skills/` (15 habilidades ativas).
  2. Criado o protocolo multi-agente e sistema de locks em `plans/MULTI_AGENT_WORKPLACE.md`.
  3. Criado o arquivo universal `AGENTS.md` na raiz do monorepo e do workspace para sincronizaÃ§Ã£o cross-tool (Cursor, Ollama, Qwen, etc.).
- **Estado do Sistema**:
  - Backend Medusa rodando na porta `9000` (Status: `200 OK`).
  - Storefront Next.js rodando na porta `8000` (Status: `200 OK`).
  - Banco de Dados Supabase conectado e travado em BRL.
- **Handoff para o PrÃ³ximo Agente (ou PrÃ³ximo Passo)**:
  - Prosseguir imediatamente com a **Sprint 1 (Fase 1.2)**: Criar os modelos DML do mÃ³dulo `restaurant` (`ModifierGroup`, `Modifier`, `RestaurantTable`, `Tab`), registrar no `medusa-config.ts` e rodar as migrations no Supabase.

---

### [SessÃ£o 002] â€” 2026-10-17 19:40
- **Agente**: Antigravity Lead AI
- **Objetivo**: CriaÃ§Ã£o do Hub Agregador do iFood no backend.
- **EntregÃ¡veis**:
  1. `apps/backend/src/services/ifood.ts`: ServiÃ§o OAuth2 com cache de token, polling e acknowledgment.
  2. `apps/backend/src/jobs/ifood-polling.ts`: Job agendado a cada 30 segundos consumindo eventos `PLC`.
  3. VariÃ¡veis no `.env` e `.env.template`.
- **Estado do Sistema**:
  - `yarn tsc --noEmit` passando com 0 erros.

---

### [SessÃ£o 001] â€” 2026-10-17 14:15
- **Agente**: Antigravity Lead AI
- **Objetivo**: White-Label dinÃ¢mico, LocalizaÃ§Ã£o BRL (Real Brasileiro) e restriÃ§Ãµes visuais no Admin.
- **EntregÃ¡veis**:
  1. Moeda padrÃ£o da Loja travada em BRL no Supabase; RegiÃ£o Brasil criada; LocalizaÃ§Ã£o renomeada para "Deposito Central".
  2. CSS estÃ¡tico (Vite) e widget runtime ocultando rotas e links macro/fiscais no Medusa Admin.
  3. FormataÃ§Ã£o monetÃ¡ria padronizada em `pt-BR` no Storefront.

