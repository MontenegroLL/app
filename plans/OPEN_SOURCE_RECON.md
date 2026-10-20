# 🧭 Reconhecimento Open-Source (Open Source Recon)

> **Objetivo:** mapear repositórios e bibliotecas de código aberto que acelerem a construção do Núcleo PDV (PDV/Food Service), mantendo o processo de construção atualizado e apoiado em ferramentas vivas.
> **Data:** 19 de outubro de 2026
> **Stack alvo:** Medusa.js v2 (2.21.2) + Next.js + PostgreSQL (Supabase) + Cloudflare + Redis + monorepo Turbo/Yarn.
> **Método:** 4 pesquisas paralelas (PDV/Food Service, KDS/impressão/fiscal, Delivery/iFood/pagamentos, Medusa/Infra/DX), cada uma com verificação em GitHub API + páginas de repositório + web search.

---

## 📚 Relatórios detalhados (fonte primária)

Este documento é o **índice consolidado e priorizado**. Os relatórios completos, com tabelas por categoria, ficam em:

| Relatório | Escopo | Caminho |
| :--- | :--- | :--- |
| **PDV & Food Service** | POS touch/PWA, gestão de restaurante, mesas/comandas/modificadores, UI de grid | *(seção 2 deste documento)* |
| **KDS, Impressão & Fiscal** | Kitchen Display Systems, ESC/POS, impressoras BR, NFC-e/NF-e/SAT | [`plans/RESEARCH_KDS_THERMAL_PRINTING.md`](./RESEARCH_KDS_THERMAL_PRINTING.md) |
| **Delivery, iFood & Pagamentos** | SDKs iFood/agregadores, logística, PIX/PSPs, WhatsApp | [`plans/RESEARCH_OPENSOURCE_BR_DELIVERY_PAYMENTS.md`](./RESEARCH_OPENSOURCE_BR_DELIVERY_PAYMENTS.md) |
| **Medusa v2, Infra, DX & Segurança** | Starters/plugins Medusa, monorepo DX, Cloudflare, Supabase, testes | [`plans/RESEARCH_OSS_MEDUSA_STACK.md`](./RESEARCH_OSS_MEDUSA_STACK.md) |

> ⚠️ **Nota de confiabilidade:** estrelas e datas são *snapshots* do momento da coleta (parte via GitHub API, parte via páginas web por rate-limit). Itens marcados `[incerto]` **devem ser reconfirmados no repositório antes de adotar**. Nenhum número foi inventado.

---

## 🎯 Veredito executivo (o que a pesquisa realmente revelou)

1. **Nada "drop-in" cobre o domínio de restaurante em Medusa/Postgres.** Não existe hoje um projeto open-source maduro que entregue mesas + comandas + modificadores + split + KDS na nossa stack. O que existe são **bases parciais** e **referências de arquitetura** — o núcleo do domínio será construído por nós.
2. **A base Medusa v2 está bem servida.** `medusa-starter-default`, `medusajs/examples` (inclui exemplo de restaurant) e `medusa-eats` (food delivery, MIT) são material direto e permissivo.
3. **Pagamentos BR são maduros; iFood NÃO.** Mercado Pago e Efí têm SDK oficial Node. iFood **não tem SDK oficial em Node** — mantemos nosso `ifood.ts` e usamos a spec oficial.
4. **KDS e impressão se resolvem por composição**, não por adoção de um sistema inteiro: encoders ESC/POS + transporte + templates + fila (BullMQ/Redis).
5. **Fiscal (NFC-e) é viável open-source em Node, mas imaturo; SAT é necessariamente comercial** (DLL do fabricante).
6. **Licenças AGPL-3.0 aparecem muito** (Fleetbase, URY, Satisfecho, trufflehog, Renovate). Para um PDV vendido como SaaS, **AGPL em serviço exposto na rede exige decisão jurídica** — marcar caso a caso. Não copiar código AGPL para dentro do produto.

---

## 🏆 Top 12 priorizado para adoção (transversal a todas as áreas)

Ordenado por **impacto × encaixe no stack**. Legenda de licença: 🟢 permissiva · 🟡 copyleft fraco · 🔴 copyleft forte (AGPL/GPL — validar uso).

| # | Ferramenta / Repo | Área | Licença | Papel no projeto |
| :-: | :--- | :--- | :-: | :--- |
| 1 | [`medusajs/medusa-starter-default`](https://github.com/medusajs/medusa-starter-default) | Medusa | `[incerto]` | Fundação oficial do backend v2 |
| 2 | [`medusajs/examples`](https://github.com/medusajs/examples) + [`medusajs/medusa-eats`](https://github.com/medusajs/medusa-eats) | Food Service | MIT / `[incerto]` | Blueprint de restaurant-marketplace e delivery 3-lados (workflows + SSE) |
| 3 | [`@medusapos/medusa-plugin`](https://github.com/medusapos/app) + **TallyUI** | PDV touch | MIT | Único POS nativo p/ Medusa v2; primitivas de UI touch; vendas viram pedidos Medusa |
| 4 | [`mercadopago/sdk-nodejs`](https://github.com/mercadopago/sdk-nodejs) | Pagamento | MIT | ✅ Já instalado — PIX + cartão + parcelamento + webhooks |
| 5 | [`efipay/sdk-node-apis-efi`](https://github.com/efipay/sdk-node-apis-efi) | PIX PSP | MIT | SDK **oficial** Efí: QR, copia-e-cola, webhooks, mTLS |
| 6 | [`fleetbase/fleetbase`](https://github.com/fleetbase/fleetbase) (+ fleetops/navigator/sdk) | Logística | 🔴 AGPL-3.0 | Motor de despacho/roteirização/tracking — validar AGPL |
| 7 | [`at-point-of-sale/ReceiptPrinterEncoder`](https://github.com/at-point-of-sale/ReceiptPrinterEncoder) + [`NetworkReceiptPrinter`](https://github.com/at-point-of-sale/NetworkReceiptPrinter) + [`Klemen1337/node-thermal-printer`](https://github.com/Klemen1337/node-thermal-printer) | Impressão | MIT | Encoding ESC/POS + transporte rede (TCP 9100) e USB/serial |
| 8 | [`receiptline/receiptline`](https://github.com/receiptline/receiptline) + [`receiptio`](https://github.com/receiptline/receiptio) | Impressão | 🟡 Apache-2.0 | Templates de comanda em Markdown + agente com status da impressora |
| 9 | [`biomejs/biome`](https://github.com/biomejs/biome) (+ Husky + lint-staged) | DX monorepo | 🟡 Apache-2.0 | Lint/format único e rápido — menos fricção entre agentes |
| 10 | [`t3-oss/t3-env`](https://github.com/t3-oss/t3-env) + [`dotenvx`](https://github.com/dotenvx/dotenvx) | DX / env | MIT / BSD-3 | Validação de env com Zod + segredos cifrados por ambiente |
| 11 | [`gitleaks`](https://github.com/gitleaks/gitleaks) + [`renovatebot/renovate`](https://github.com/renovatebot/renovate) + `CodeQL` | Segurança | MIT / 🔴 AGPL / MIT | Scanner de segredos + deps + SAST no CI (crítico com múltiplos agentes) |
| 12 | [`marsidev/react-turnstile`](https://github.com/marsidev/react-turnstile) + [`supabase/cli`](https://github.com/supabase/cli) + [`wrangler-action`](https://github.com/cloudflare/wrangler-action) | Infra | MIT / `[incerto]` / 🟡 Apache | Turnstile (padrão CF), migrations Supabase no CI, deploy CF |

**Suporte:** `vitest` + `playwright` (testes), `changesets` (release de monorepo), `medusajs/medusa-agent-skills` + `cloudflare/skills` (skills para os agentes de IA).

---

## 🧩 Como as peças se encaixam

```text
[Next.js PDV/Storefront]  --pedido-->  [Medusa v2 API]  --evento-->  [Redis Pub/Sub]
        │                                     │                            │
        │  TallyUI (grid/carrinho)            │  workflows + módulo         ├──> [WS Gateway Node] --> [Next.js KDS / Bar]
        │  t3-env (env)                       │  restaurant (DML)           │
        │                                     │                             └──> [Fila BullMQ] --> [Print Service]
        │                                     │                                       ReceiptPrinterEncoder/receiptline
        │                                     │                                              │
        │                                     │                                              v
        │                                     │                                   [Impressora 9100/USB/WebUSB]
        │                                     │
        │                                     └──> [Fleetbase FleetOps] (despacho)  e  [Efí / Mercado Pago] (PIX/cartão)
        │
        └──> Supabase (Postgres/Realtime) + Cloudflare (edge/WAF/Turnstile)
```

---

## ⛔ O que NÃO adotar (e por quê)

| Item | Motivo |
| :--- | :--- |
| `medusajs/nextjs-starter-medusa` | **Arquivado** (2026-04-23) |
| `medusajs/b2b-starter-medusa` | **Arquivado** (substituído por `b2b-starter`) |
| `medusajs/ui` (repo separado) | **Arquivado** desde 2023 — use o pacote `@medusajs/ui` |
| `medusajs/docker-medusa` | Não é oficial (comunidade), último push 2024 — validar p/ v2 |
| `NewPointe/KitchenView`, `FoodStreams`, `BenClementt/OpenKDS` | KDS abandonados/arquivados |
| `nfephp-org/posprint` | README declara **não funcional** (alpha) |
| SDKs Asaas/PagSeguro não-oficiais (2–16 commits) | Imaturos — usar REST direto |
| `open-ifood/node-sdk`, `open-ifood/sdk` (Java), `golang-ifood-sdk` | Estagnados / linguagem errada |
| `opensourcepos`, `NexoPOS`, `Floreant`, `SambaPOS` | Stack incompatível (PHP/Java/desktop) ou módulos pagos |
| `trufflehog` em produto comercial | Licença **AGPL-3.0** (usar `gitleaks`, MIT) |

---

## ⚠️ Riscos e decisões pendentes (não técnicos)

1. **Jurídico — AGPL:** Fleetbase, URY, Satisfecho, Renovate (como código), trufflehog. Self-host interno é OK; **SaaS modificado obriga a abrir código**. Decidir antes de adotar como base.
2. **Jurídico — Licenças não detectadas:** vários starters Medusa não têm SPDX detectado. **Confirmar `LICENSE`** antes de commitar código derivado.
3. **Arquitetura — Medusa + Supabase (pooler):** a issue oficial de "duas connection strings" segue aberta. Use **direct connection** para migrations (CI) e **session pooler** no runtime. Ver `RESEARCH_OSS_MEDUSA_STACK.md` §3.
4. **Arquitetura — RLS não protege as queries do Medusa** (o role conecta como bypass). RLS só cobre acesso direto via Supabase. Autorização de tenant precisa estar na aplicação.
5. **Infra — não rodar Medusa em Cloudflare Workers** (servidor Node de longa duração). Workers apenas para edge/WAF/Turnstile.
6. **Fiscal — SAT é comercial** (DLL do fabricante). NFC-e em Node (`@fiscal-rs/node`, MIT) é jovem — validar em homologação SEFAZ.
7. **Operacional — impressão silenciosa no browser** exige Chromium + HTTPS + gesto; fallback = agente Node local (preferível) ou QZ Tray (licença comercial para silencioso).
8. **Segurança interna do repo:** hoje há segredos em texto puro na raiz (`supabase-key.txt`, `medusa -pass`, `medusa-recovery-codes.txt`) e o projeto **não é um repositório git**. Antes de adotar gitleaks/Renovate/Changesets, versionar o código e remover/rotacionar esses arquivos.

---

## ✅ Próximos passos sugeridos

1. **Higiene primeiro:** inicializar git (com `.gitignore` rigoroso), mover/rotacionar segredos, então plugar `gitleaks` + `biome` + `husky` antes do primeiro commit.
2. **Prova de conceito (1–2 dias):** Medusa 2.21 dev store + `@medusapos/medusa-plugin` → validar ingestão de vendas como pedidos Medusa.
3. **Prototipar o PDV Touch** com TallyUI (grid + carrinho + teclado) e definir o schema de restaurante (mesas/comandas/modificadores/split) inspirando-se em URY e Satisfecho, implementado como **módulo Medusa v2**.
4. **Padronizar `env.ts` com `t3-env`** em backend e storefront.
5. **Iniciar homologação iFood em paralelo** (maior risco externo; sem SDK oficial).
6. **Decidir o fornecedor fiscal** (ACBr self-hosted vs. API SaaS) antes de fechar o MVP.

---

*Documento consolidado a partir de 4 pesquisas paralelas. Detalhes, tabelas completas e fontes verificadas estão nos relatórios individuais referenciados no topo.*
