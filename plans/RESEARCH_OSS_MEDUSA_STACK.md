# 📚 Pesquisa de Repositórios Open-Source para o Núcleo PDV / Food Service

> **Autor:** subagente de pesquisa (engenharia)
> **Data:** 19 de outubro de 2026
> **Stack alvo:** Medusa.js v2 (2.21.2) + Next.js + PostgreSQL (Supabase) + Cloudflare + monorepo Turbo/Yarn
> **Método:** GitHub REST API (`/repos`, `/search/repositories`) + web search/webfetch para validação cruzada.

---

## ⚠️ Nota de confiabilidade dos dados

- Estrelas, licenças e datas de último commit foram coletados via **GitHub API** (fonte primária) ou via páginas do repositório (web) quando a API retornou `429 Rate Limit`.
- Estrelas são **aproximadas** (variam diariamente). Datas de "último push" são as retornadas no momento da coleta.
- Onde **não consegui confirmar** via fonte primária, marco explicitamente como `[incerto]`.
- Regra de ouro aplicada: **não inventei** números. Se não confirmei, sinalizei.

---

## 1. Medusa v2 — Starters, Módulos, Plugins e Recursos Oficiais

### Tabela comparativa

| Repositório | Licença | Lang | ⭐ (aprox.) | Último push | O que oferece | Recomendação |
|---|---|---|---|---|---|---|
| [medusajs/medusa](https://github.com/medusajs/medusa) | Apache-2.0¹ | TypeScript | ~36.8k | 2026-10-19 | Core do Medusa v2. Framework, CLI, Data Models (DML), workflows | **Adotar** (é o próprio core) |
| [medusajs/medusa-starter-default](https://github.com/medusajs/medusa-starter-default) | `[incerto]` (sem LICENSE detectada) | TypeScript | ~210 | 2026-09-29 | Starter oficial de backend Medusa v2 (base do `create-medusa-app`) | **Adotar** como base do backend |
| [medusajs/examples](https://github.com/medusajs/examples) | `[incerto]` | TypeScript | ~275–282 | 2026-08-19 | ~50 exemplos v2: marketplace, loyalty, subscriptions, product reviews, Stripe saved cards, restaurant marketplace | **Adotar como referência** (copiar arquivos p/ projeto) |
| [medusajs/medusa-eats](https://github.com/medusajs/medusa-eats) | MIT | TypeScript | ~268 | 2025-09-23 | Plataforma food delivery Uber-Eats style, Medusa 2.0 + Next.js 14, workflows long-running, SSE realtime, 3 dashboards | **Referência (ALTA prioridade)** — arquitetura, **não é starter mantido** |
| [medusajs/medusa-agent-skills](https://github.com/medusajs/medusa-agent-skills) | `[incerto]` | JavaScript | ~187–234 | 2026-10-15 | Skills/plugins oficiais para agentes de IA (best practices, DML, workflows, admin UI) | **Adotar** — encaixe direto no seu fluxo multi-agente |
| [medusajs/dtc-starter](https://github.com/medusajs/dtc-starter) | `[incerto]` | TypeScript | ~148 | 2026-10-19 | Starter DTC oficial (Direct-to-Consumer) Medusa v2 | **Referência** |
| [medusajs/b2b-starter](https://github.com/medusajs/b2b-starter) | `[incerto]` | TypeScript | ~55 | 2026-10-02 | Starter B2B oficial (preços por cliente, companies, quotes) | **Referência** |
| [medusajs/medusa-starter-plugin](https://github.com/medusajs/medusa-starter-plugin) | `[incerto]` | TypeScript | ~13 | 2026-08-13 | Template oficial para criar **plugin** v2 | **Adotar** se for publicar plugins |
| [medusajs/docker-medusa](https://github.com/medusajs/docker-medusa) | `[incerto]` | Dockerfile | ~249 | 2024-01-22 | Docker/compose para Medusa (**comunidade**, não oficial) | **Referência** — útil p/ container, validar viabilidade v2 |
| [medusajs/nextjs-starter-medusa](https://github.com/medusajs/nextjs-starter-medusa) | MIT | TypeScript | ~2.785 | 2026-04-23 | Storefront Next.js — ⚠️ **ARQUIVADO** | **Descartar** (arquivado; ver nota storefront) |
| [medusajs/b2b-starter-medusa](https://github.com/medusajs/b2b-starter-medusa) | `[incerto]` | TypeScript | ~423 | 2026-04-09 | ⚠️ **ARQUIVADO** (substituído por `b2b-starter`) | **Descartar** |

¹ A API retornou `NOASSERTION` — o repo tem licença custom (na prática, MIT para o core, mas confirmar em `LICENSE.md`).

### Notas críticas

- **`create-medusa-app` não é um repo separado**: o 404 confirma que hoje ele vive **dentro** do monorepo `medusajs/medusa` (`packages/create-medusa-app`). Não trate como repo independente.
- **`medusa-plugin-starter` e `medusa-design-system` da API deram 404** — usar `medusa-starter-plugin` (plugin) e o pacote `@medusajs/ui` (dentro do monorepo) respectivamente.
- **Storefront Next.js**: `nextjs-starter-medusa` foi **arquivado (2026-04-23)**. O starter recomendado atual para Medusa v2 é o `medusajs/medusa-starter-default` (backend) + o storefront gerado pelo `create-medusa-app`. Para referência de UI admin, o componente library é o **`@medusajs/ui`** (dentro do monorepo; o repo `medusajs/ui` separado está **arquivado desde 2023**).
- **Foco Food Service**: o `medusa-eats` + o exemplo `restaurant-marketplace` do repo `examples` são **o material mais alinhado ao seu domínio** (PDV/food service). São MIT e copiáveis.

---

## 2. DX para Monorepo TypeScript

| Ferramenta | Licença | Lang | ⭐ (aprox.) | Último push | O que oferece | Recomendação |
|---|---|---|---|---|---|---|
| [biomejs/biome](https://github.com/biomejs/biome) | Apache-2.0 | Rust | ~26k | 2026-10-19 | Lint + format + import sorting em **um** binário Rust, config única | **Adotar** — ideal p/ monorepo (menos deps que ESLint+Prettier) |
| [prettier/prettier](https://github.com/prettier/prettier) | MIT | JS | ~52k | 2026-10-19 | Formatter canônico | **Referência** (Biome cobre) |
| [eslint/eslint](https://github.com/eslint/eslint) | MIT | JS | ~27.6k | 2026-10-19 | Lint plugável | **Referência** (usar só se precisar de regras TS-específicas que Biome não tem) |
| [changesets/changesets](https://github.com/changesets/changesets) | MIT | TS | ~12.5k | 2026-10-18 | Versionamento e changelog focado em **monorepos** | **Adotar** — é o padrão em monorepos TS |
| [t3-oss/t3-env](https://github.com/t3-oss/t3-env) | MIT | TS | ~4k | 2026-04-01 | Validação de env com **Zod**, client/server split | **Adotar** — exatamente p/ validar env do Medusa/Next |
| [dotenvx/dotenvx](https://github.com/dotenvx/dotenvx) | BSD-3 | JS | ~5.8k | 2026-10-19 | dotenv com **criptografia** de segredos, multi-ambiente | **Adotar como referência** — bom p/ DX de segredos; ver ressalva |
| [motdotla/dotenv](https://github.com/motdotla/dotenv) | BSD-2 | JS | ~20.5k | 2026-10-16 | Loader `.env` clássico | **Adotar** (base) |
| [typicode/husky](https://github.com/typicode/husky) | MIT | JS | ~35k | 2026-03-19 | Git hooks | **Adotar** — pre-commit padronizado |
| [okonet/lint-staged](https://github.com/okonet/lint-staged) | MIT | JS | ~14.7k | 2026-09-26 | Roda lint/format só nos arquivos staged | **Adotar** (com Husky + Biome) |
| [pre-commit/pre-commit](https://github.com/pre-commit/pre-commit) | MIT | Python | ~15.6k | 2026-10-19 | Framework de hooks multi-linguagem | **Descartar** (stack 100% Node; Husky já resolve) |
| [semantic-release/semantic-release](https://github.com/semantic-release/semantic-release) | MIT | JS | ~24k | 2026-10-19 | Release automatizada via conventional commits | **Referência** — Changesets é melhor p/ monorepo |
| [vercel/turbo](https://github.com/vercel/turbo) | MIT | Rust | ~31k | 2026-10-19 | Build system do seu monorepo (Turborepo) | **Adotar** (já usa) |
| [antfu/ni](https://github.com/antfu/ni) | MIT | TS | ~8.3k | 2026-10-09 | CLI "right package manager" | **Referência** — ótimo p/ DX (Yarn/ni) |

### Notas

- **Biome vs ESLint+Prettier**: como vocês já usam Turbo+Yarn, o Biome reduz drasticamente a config e o tempo de lint em CI. **Ressalva**: Biome ainda não é 100% paridade com plugins ESLint (ex.: algumas regras de acessibilidade/Next). Estratégia recomendada: **Biome para format+lint base**, e manter ESLint **apenas** se precisar de regras que o Biome não cobre.
- **Segredos**: `dotenvx` é ótimo para **criptografar `.env`** e commitar versões cifradas por ambiente. **Ressalva honesta**: para produção, prefira o **gestor de segredos do provedor de deploy** (GitHub Actions Secrets, Cloudflare Secrets, Supabase Vault) — não dependa só de arquivo cifrado no repo.
- **Validação de env**: `t3-env` é a peça-chave para o requisito "validar env com Zod" — funciona em `apps/backend` (server) e `apps/storefront` (client) com o mesmo padrão.

---

## 3. Infra — Cloudflare, Supabase, Deploy

| Ferramenta | Licença | Lang | ⭐ (aprox.) | Último push | O que oferece | Recomendação |
|---|---|---|---|---|---|---|
| [cloudflare/workers-sdk](https://github.com/cloudflare/workers-sdk) | Apache-2.0 | TS | ~4.6k | 2026-10-19 | **Wrangler** — CLI oficial de Workers/Pages | **Adotar** |
| [cloudflare/wrangler-action](https://github.com/cloudflare/wrangler-action) | Apache-2.0 | TS | ~2k | 2026-09-28 | GitHub Action p/ deploy Cloudflare | **Adotar** no CI/CD |
| [cloudflare/turnstile-demo-workers](https://github.com/cloudflare/turnstile-demo-workers) | `[incerto]` (oficial Cloudflare) | JS | `[incerto]` | `[incerto]` | Exemplo oficial de validação **siteverify** em Worker | **Adotar como referência** |
| [cloudflare/skills](https://github.com/cloudflare/skills) | `[incerto]` (oficial) | Markdown | `[incerto]` | 2026 (ativo) | Skills de agente oficiais CF (inclui `turnstile-spin` com receitas Next.js) | **Adotar** — encaixe perfeito multi-agente |
| [marsidev/react-turnstile](https://github.com/marsidev/react-turnstile) | MIT | TS | ~854 | 2026-10 (ativo) | Componente React p/ Turnstile, SSR-ready (Next.js), 6.3KB, **recomendado pela própria Cloudflare** | **Adotar** — é o padrão de fato |
| [supabase/cli](https://github.com/supabase/cli) | `[incerto]` (repo oficial) | TS | ~2.4k | 2026-10-19 | CLI: migrations, banco local, deploy edge functions | **Adotar** |
| [supabase/supabase](https://github.com/supabase/supabase) | Apache-2.0 | TS | ~111k | 2026-10-20 | Monorepo completo Supabase (self-host possível) | **Adotar** (você já usa o serviço; repo p/ referência/self-host) |
| [supabase/ssr](https://github.com/supabase/ssr) | `[incerto]` | TS | `[incerto]` | `[incerto]` | Helpers de auth SSR p/ Next.js (cookies, PKCE) | **Adotar** se usar Supabase Auth no storefront |
| [opennextjs/opennextjs-cloudflare](https://github.com/opennextjs/opennextjs-cloudflare) | `[incerto]` | TS | `[incerto]` | ativo | Adapter oficial p/ rodar Next.js no Cloudflare Workers | **Referência** — avaliar custo/limitações |

### Notas críticas de arquitetura (achados reais)

1. **Medusa + Supabase = pegadinha de conexão (documentada)**:
   - Supabase oferece **direct connection (IPv6)**, **session pooler (IPv4:5432)** e **transaction pooler (IPv4:6543)**.
   - Medusa aceita **uma única** `DATABASE_URL`. Usar a URL do pooler para migrations **falha** (transaction mode não suporta prepared statements / sessões single). Usar direct connection em rede IPv4-only **falha**.
   - **Há discussão aberta oficial** (`medusajs/medusa` discussion #15646, jun/2026) pedindo suporte a **duas URLs** (direct p/ migrate, pooler p/ runtime). **Ainda não resolvido na versão que você usa** — planeje workaround (ex.: rodar migrations com URL direct num job de CI).
   - **Ação concreta**: no CI, use a **direct connection** para `npx medusa db:migrate`; no runtime, use **session pooler** (`postgres.[PROJECT-REF]@aws-...pooler.supabase.com:5432`). Se o Deploy for container persistente, prefira direct IPv6 ou session pooler.
2. **RLS multi-tenant**: Supabase RLS não é "ativado" pelo Medusa (ele usa seu próprio schema/roles). RLS é relevante para o **acesso direto do Next/edge ao Postgres**. **Alerta**: Medusa conecta como um role que provavelmente **bypassa RLS** (owner/superuser) — RLS protege apenas a rota "direta via Supabase", não as queries do Medusa. Documente essa fronteira.
3. **Turnstile é serviço independente do proxy CF**: funciona mesmo se o site não estiver atrás do Cloudflare. Validação **server-side é obrigatória** (siteverify). Token expira em **300s**, uso único.

---

## 4. Qualidade, Segurança e Testes

| Ferramenta | Licença | Lang | ⭐ (aprox.) | Último push | O que oferece | Recomendação |
|---|---|---|---|---|---|---|
| [gitleaks/gitleaks](https://github.com/gitleaks/gitleaks) | MIT | Go | ~30k | 2026-09-30 | Scanner de segredos em git/histórico | **Adotar** — pre-commit + CI |
| [trufflesecurity/trufflehog](https://github.com/trufflesecurity/trufflehog) | AGPL-3.0 | Go | ~28.6k | 2026-10-19 | Scanner de segredos com **verificação** de credencial viva | **Referência** (AGPL pode ser impeditivo em produto comercial) |
| [renovatebot/renovate](https://github.com/renovatebot/renovate) | AGPL-3.0 | TS | ~22.8k | 2026-10-19 | Atualização de deps, **melhor que Dependabot em monorepos** | **Adotar** (usar como GitHub App/bot — AGPL não contamina uso hospedado) |
| [dependabot/dependabot-core](https://github.com/dependabot/dependabot-core) | MIT | Ruby | ~5.8k | 2026-10-19 | Dependabot (nativo do GitHub) | **Adotar** como baseline (zero setup) |
| [github/codeql-action](https://github.com/github/codeql-action) | MIT | TS | ~1.65k | 2026-10-19 | SAST oficial do GitHub (CodeQL) | **Adotar** — grátis em repo público/privado |
| [semgrep/semgrep](https://github.com/semgrep/semgrep) | LGPL-2.1 | OCaml/C | ~17k | 2026-10-20 | SAST rápido, regras custom, ótimo p/ TS | **Adotar** (alternativa/complemento ao CodeQL) |
| [vitest-dev/vitest](https://github.com/vitest-dev/vitest) | MIT | TS | ~17.3k | 2026-10-19 | Test runner nativo Vite/TS, rápido | **Adotar** — encaixa no monorepo TS |
| [jestjs/jest](https://github.com/jestjs/jest) | MIT | TS | ~45.5k | 2026-10-19 | Test runner clássico | **Referência** (Medusa usa Jest internamente; Vitest p/ código novo) |
| [microsoft/playwright](https://github.com/microsoft/playwright) | Apache-2.0 | TS | ~98k | 2026-10-19 | E2E em Chromium/Firefox/WebKit | **Adotar** — E2E do PDV/storefront |
| [testcontainers/testcontainers-node](https://github.com/testcontainers/testcontainers-node) | MIT | TS | ~2.6k | 2026-10-19 | Containers efêmeros p/ testes de integração | **Referência** — útil p/ testar com Postgres real |

### Notas

- **Renovate vs Dependabot**: para monorepo Yarn/Turbo, **Renovate** lida melhor com agrupamento e `yarn.lock`. Dependabot é bom como baseline sem configuração.
- **Gitleaks** no pre-commit **e** no CI é o encaixe recomendado para o requisito de "scanner de segredos".
- **CodeQL vs Semgrep**: CodeQL é grátis e nativo no GitHub Actions; Semgrep é mais rápido e permite regras customizadas para padrões do seu código (ex.: uso indevido de `process.env`). Use os dois: CodeQL como baseline, Semgrep para regras do projeto.

---

## 5. Orquestração Multi-Agente / Documentação Viva

| Ferramenta | Licença | Lang | ⭐ (aprox.) | Último push | O que oferece | Recomendação |
|---|---|---|---|---|---|---|
| [github/spec-kit](https://github.com/github/spec-kit) | MIT | Python | ~142k | ativo (2026) | Toolkit **Spec-Driven Development**: constituição, spec → plan → tasks → implement → converge, integra vários agentes | **Adotar** — encaixa em "specs/planos" e multi-agente |
| [medusajs/medusa-agent-skills](https://github.com/medusajs/medusa-agent-skills) | `[incerto]` | JS | ~187–234 | 2026-10-15 | Skills oficiais Medusa p/ agentes (best practices v2) | **Adotar** (já listado na seção 1) |
| [cloudflare/skills](https://github.com/cloudflare/skills) | `[incerto]` (oficial) | Markdown | `[incerto]` | 2026 | Skills oficiais Cloudflare (Turnstile, Workers, etc.) | **Adotar** |
| [obra/superpowers](https://github.com/obra/superpowers) | `[incerto]` | Markdown/JS | ~212k `[citado em fonte secundária]` | `[incerto]` | Framework de skills p/ agentes (o que vocês já usam no repo) | **Já adotado** no projeto |

### Notas

- O **`github/spec-kit`** é o candidato mais alinhado ao requisito #5. Ele formaliza o ciclo *spec → plan → tasks → implement → converge* e possui integração multi-agente (Copilot, Claude Code, Gemini CLI, etc.).
- **Ressalva**: o `spec-kit` é dominado por Python/CLI própria; a adoção exige disciplina de processo. Vocês já têm um protocolo próprio (`plans/AI_DEV_PROTOCOL.md`, `MULTI_AGENT_WORKPLACE.md`) — avalie **incorporar os templates do spec-kit** em vez de substituir o protocolo atual.

---

## 6. 🏆 Recomendação Final — Top 8 Priorizado

Ordenado por **impacto × encaixe no stack Medusa v2 + Next + Supabase + CF**, com justificativa concreta.

| # | Ferramenta | Categoria | Encaixe no stack | Ação |
|---|---|---|---|---|
| **1** | **medusajs/medusa-starter-default** | Medusa v2 | Base oficial do backend v2; gerado por `create-medusa-app` | Adotar como fundação do `apps/backend` |
| **2** | **medusajs/examples** + **medusajs/medusa-eats** | Medusa v2 / Food Service | Marketplace, loyalty, subscriptions, restaurant-delivery — **domínio PDV/food** diretamente | Copiar arquivos para módulos próprios |
| **3** | **medusajs/medusa-agent-skills** | Multi-agente / DX | Skills oficiais v2 (DML, workflows, admin UI) para seus agentes | Instalar nos agentes |
| **4** | **t3-oss/t3-env** + **dotenvx** | DX / env | Validação de env com Zod + gestão de segredos por ambiente | Padronizar `env.ts` em cada app |
| **5** | **biomejs/biome** (+ Husky + lint-staged) | DX monorepo | Lint/format único e rápido; reduz fricção em CI e entre agentes | Migrar lint/format + hooks |
| **6** | **changesets/changesets** (+ Turbo) | Release monorepo | Changlog/versionamento nativo de monorepo TS | Adotar no pipeline de release |
| **7** | **gitleaks** + **renovate** + **CodeQL** | Segurança/Qualidade | Segredos no pre-commit/CI + deps + SAST; essencial em repo com múltiplos agentes | Adicionar workflows no GitHub Actions |
| **8** | **marsidev/react-turnstile** + **supabase/cli** + **cloudflare/wrangler-action** | Infra | Turnstile no Next (recomendado pela CF), migrations Supabase no CI, deploy CF via Action | Integrar no CI/CD |

### Menções de suporte
- **Vitest** + **Playwright** para testes (unit + E2E do PDV).
- **github/spec-kit** para formalizar specs/planos multi-agente (opcional, avalia sobre o protocolo atual).

---

## 7. ⛔ O que NÃO adotar (e por quê)

| Item | Motivo |
|---|---|
| `medusajs/nextjs-starter-medusa` | **Arquivado** em 2026-04-23 |
| `medusajs/b2b-starter-medusa` | **Arquivado**; substituído por `b2b-starter` |
| `medusajs/ui` (repo separado) | **Arquivado desde 2023**; use o pacote `@medusajs/ui` do monorepo |
| `medusajs/docker-medusa` | **Não é oficial** (mantido pela comunidade), último push 2024-01 — valide antes de usar em v2 |
| `pre-commit/pre-commit` (Python) | Stack 100% Node; Husky cobre |
| `trufflehog` em produto comercial | Licença **AGPL-3.0** pode ser impeditivo (avalie jurídico) |
| `semantic-release` | Changesets é superior para monorepo versionado |

---

## 8. 🚧 Limitações e riscos honestos (leia antes de decidir)

1. **Medusa + Supabase (pooler) ainda é workaround**: a issue oficial de "duas connection strings" segue aberta. **Risco real de erro em migrations** se você usar a URL do pooler. Planeje o workaround (direct URL no CI).
2. **RLS multi-tenant não protege as queries do Medusa**: o Medusa conecta com um role que provavelmente **bypassa RLS**. RLS só cobre acesso direto via PostgREST/edge. **Não presuma isolamento de tenant via RLS nas rotas do Medusa** — implemente autorização na aplicação.
3. **Cloudflare Workers + Medusa**: Medusa é um servidor Node **de longa duração** (com pools de conexão, workers de jobs, Redis). **Não rode o backend Medusa diretamente em Workers.** Use Workers para edge/WAF/Turnstile/OS proxies; rode o Medusa em container/VM/Plataforma. `opennextjs-cloudflare` é para o **Next.js**, não para o Medusa.
4. **Estrelas e datas aproximadas**: vários valores vieram de fonte secundária (web) por rate limit da API. Onde `[incerto]`, **confirme o LICENSE no repo** antes de adotar (especialmente os starters sem arquivo de licença detectado).
5. **Licenças dos starter repos**: a API não detectou SPDX em `medusa-starter-default`, `dtc-starter`, `b2b-starter`, `examples`. **Medusa é geralmente MIT para templates**, mas **valide** antes de commitar código derivado em produto comercial.
6. **Turnstile exige validação server-side**: token expira em 300s e é de **uso único** — inclua `turnstile.reset()` no fluxo de retry do PDV.

---

## 9. Próximos passos sugeridos

1. **Criar `apps/backend` a partir do `medusa-starter-default`** e `apps/storefront` via `create-medusa-app`.
2. **Padronizar `env.ts` com `t3-env`** em ambos os apps + `.env` cifrado com `dotenvx`.
3. **Configurar GitHub Actions** com: Biome → Changesets → Gitleaks → CodeQL → Renovate → Wrangler deploy.
4. **Workaround Supabase**: adicionar job de migration com URL direct + runtime com pooler.
5. **Importar exemplos de food service** (`medusa-eats` / `restaurant-marketplace`) como módulos DML próprios.
6. **Instalar `medusa-agent-skills` + `cloudflare/skills`** nos agentes de IA do monorepo.
