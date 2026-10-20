# Pesquisa de Repositórios Open-Source para PDV/Food Service BR

**Alvo:** Backend Medusa.js v2 (Node/TypeScript) + PostgreSQL/Supabase — restaurantes no Brasil (delivery próprio, iFood, logística de entregadores, PIX/cartão).

**Data da pesquisa:** Out/2026
**Método:** busca web + verificação nas páginas do GitHub/npm. Estrelas e datas são aproximadas (snapshot do momento da consulta). Onde não consegui confirmar por leitura direta, está marcado como *incerto*.

> ⚠️ **Aviso de honestidade:** o ecossistema brasileiro de iFood/agregadores é **pobre em SDKs oficiais**. Quase tudo é comunitário, pequeno e imaturo. Para iFood, a recomendação realista é **escrever seu próprio client** (você já tem `ifood.ts`) usando a documentação oficial, e usar os repos abaixo apenas como *referência*. O cenário de pagamentos (PIX/Mercado Pago) é bem mais maduro.

---

## TL;DR — Top recomendações por subárea

| Subárea | Melhor escolha | Encaixe no stack |
|---|---|---|
| iFood | **Escrever próprio client** + `theYahia/ifood-mcp` (referência TS) | Referência de fluxo polling/ack/catálogo v2 |
| Logística/delivery | **Fleetbase (fleetops + navigator-app)** | REST API + webhooks via HTTP do Medusa; AGPL exige atenção |
| PIX (BR Code) | **`gpix`** ou **`qrcode-pix`** | Geração de payload EMV/BRCode em TS, zero backend |
| PIX/cobrança (PSP) | **`efipay/sdk-node-apis-efi`** (oficial Efí) | SDK oficial, MIT, TS, com webhooks |
| Mercado Pago | **`mercadopago/sdk-nodejs`** (oficial) | Já instalado no projeto — usar |
| Gateway Medusa BR | **`@nicogorga/medusa-payment-mercadopago`** ou **`@hewsos/medusa-pay-mpago`** | Provider nativo Medusa v2 com PIX |
| WhatsApp | **Evolution API / Baileys** | REST própria; rodar como serviço separado |

---

## 1. Integração com iFood e agregadores BR

### 1.1 Contexto oficial (o que existe de verdade)

A **iFood Developer** (`developer.ifood.com.br`) mantém APIs REST oficiais (Merchant, Order, Catalog, Logistics, Financial, Review, Shipping), autenticação **OAuth2**, e um fluxo de **polling + acknowledgment** (recomendado a cada ~30s). **Não há SDK oficial em Node/TypeScript** publicado pela iFood.

- **`ifood/ifood-merchant-api-examples`** — citado em alguns resultados de busca, mas **retornou HTTP 404** ao acessar diretamente. Provavelmente é **privado ou restrito a parceiros**. *Incerto.* Trate como não-público.
- Org oficial `ifood` no GitHub: possui apenas `ifood/buck` (build system, irrelevante). **Nada de SDK de integração.**

**Conclusão:** para iFood, você **não tem SDK oficial**. Mantenha seu `ifood.ts` e use OAuth2 `client_credentials` (ou `authorization_code` no modelo de distribuição multi-loja).

### 1.2 SDKs comunitários (referência)

| Repo | URL | Licença | Lang | Atividade | O que oferece | Recomendação |
|---|---|---|---|---|---|---|
| **`theYahia/ifood-mcp`** | github.com/theYahia/ifood-mcp | MIT | TypeScript | recente (2026), ~1★, 8 commits | MCP server p/ iFood Merchant API. **26 ferramentas** TS cobrindo pedidos, merchant, catálogo v2. OAuth2, retry 429/5xx, refresh 401, polling/ack. | **Referência** (código TS real e útil, mas 1★ e endpoints não-verificados) |
| **`open-ifood/node-sdk`** | github.com/open-ifood/node-sdk | MIT | TypeScript | ~57 commits, 0★, parece **estagnado** | Client API do iFood Marketplace API (sessões, pedidos, produtos). | **Referência fraca / descartar** como dependência (0★, legado) |
| **`open-ifood/sdk`** | github.com/open-ifood/sdk | BSD-3 | **Java** | 2024, 0★ | SDK da API **Customer** (não Merchant), Maven. | **Descartar** (linguagem errada p/ seu stack) |
| **`arxdsilva/golang-ifood-sdk`** | github.com/arxdsilva/golang-ifood-sdk | MIT | Go | 2021, parado | SDK Go para iFood (V1/V2, polling, ack). | **Descartar** (Go, abandonado) — mas bom para entender o fluxo |
| **`JVBorges/ifood-api`** | github.com/JVBorges/ifood-api | — | Node/TS | pouca atividade | Starter de API Node/TS *inspirado* no iFood (não é client real). | **Descartar** |
| **`rdvid/pdv-api-ifood`** | github.com/rdvid/pdv-api-ifood | MIT | Node/TS/Express | ~92 commits | PDV REST API (usuários, CRUD, S3, JWT) — **não é client iFood**, só o nome. | **Descartar** (fora de escopo) |
| **`jhonny2pamp/ifood_mercado`** | github.com/jhonny2pamp/ifood_mercado | MIT | C# | 2 commits, abandonado | SDK C# iFood Mercado. | **Descartar** |
| **n8n-nodes-ifood** | ncnodes.com/package/n8n-nodes-ifood | comunitário | — | ativo | Node n8n com ações Merchant (list/get/interruptions/hours/status). | **Referência** se usar n8n; não é lib |

### 1.3 Outros agregadores BR

- **99Food Open Platform** — possui API oficial documentada (`developer-food.99app.com.br` / OpenAPI). **Sem SDK Node OSS conhecido.** Integraria via REST própria.
- **Rappi Partners REST API** — API oficial de parceiros (POS & Aggregator Integration, catálogo, last-mile). **Sem SDK OSS Node.** Existe `api-evangelist/rappi` (perfil de API, não código).
- **Goomer** — plataforma de cardápio/delivery BR. Existe `luisescosta/goomer-api` (Laravel/PHP, 1★) — **não é o client oficial**, apenas um backend de exemplo em PHP. **Descartar** para Node.
- **Delivery Much** — sem repo OSS relevante encontrado. *Incerto/nada público.*
- **`haefrain/delivery-orders-hub`** — projeto-showcase (NestJS + BullMQ + Vue) que **simula** webhooks de Rappi/Uber Eats/DiDi e normaliza dialetos num kanban. MIT, 2026. **Referência arquitetural** (padrão adapter + fila + normalização), não produção.

**Veredito iFood/agregadores:** subárea imatura em OSS. Boa arquitetura = **um adapter por agregador** com normalização para um modelo interno (inspire-se em `delivery-orders-hub`). iFood você mesmo implementa.

---

## 2. Sistemas de delivery/logística open-source

### 2.1 Fleetbase (o mais relevante para o seu caso)

| Repo | URL | Licença | Lang | Atividade | O que oferece |
|---|---|---|---|---|---|
| **`fleetbase/fleetbase`** | github.com/fleetbase/fleetbase | **AGPL-3.0** (dual, com licença comercial) | JS/TS/Ember | **Muito ativo** (~1.530 commits, ~4.3k★) | LSOS modular: FleetOps (despacho, roteirização, tracking), Storefront (commerce headless), Pallet (WMS), Ledger (financeiro). REST API + WebSocket + webhooks. |
| `fleetbase/fleetops` | github.com/fleetbase/fleetops | AGPL-3.0 | JS | ativo | TMS: ordem, motorista, veículo, live tracking, route optimization. |
| `fleetbase/navigator-app` | github.com/fleetbase/navigator-app | AGPL-3.0 | React Native | ativo | App do entregador (dispatch, navegação, proof of delivery). |
| `fleetbase/fleetbase-js` | github.com/fleetbase/fleetbase-js | AGPL-3.0 | TS | ativo | **SDK JS/Node oficial** — `@fleetbase/sdk`. |
| `fleetbase/storefront-js` | github.com/fleetbase/storefront-js | AGPL-3.0 | TS | ativo | SDK Node do Storefront. |

**O que encaixa no Medusa:** Fleetbase vira o **motor de logística** (despacho/roteirização/tracking), e o Medusa permanece o **motor de commerce/pedidos**. Integração via **REST API + webhooks** do Fleetbase (SDK `@fleetbase/sdk` em Node). Ex.: ao criar fulfillment no Medusa → cria/dá dispatch de ordem no Fleetbase; Fleetbase manda webhook de status/ETA → atualiza pedido no Medusa.

**⚠️ Alerta AGPL-3.0:** se você **modificar** o Fleetbase e **oferecer como serviço de rede** (SaaS multi-tenant), a AGPL obriga a disponibilizar o código modificado. Para **self-host interno** ou uso via API não-modificada, é OK. Se for vender como produto, considere a licença comercial da Fleetbase ou isole num serviço separado consumido por API. **Isto é decisão jurídica — valide antes de adotar.**

**Veredito:** **Adotar como referência forte / candidato a adotar** — é o sistema de logística OSS mais maduro e alinhado a food delivery. Você já planejava Fleetbase; a pesquisa confirma que é a melhor opção aberta.

### 2.2 Alternativas e referências

| Repo | URL | Licença | Lang | Atividade | Recomendação |
|---|---|---|---|---|---|
| **`medusajs/medusa-eats`** | github.com/medusajs/medusa-eats | MIT | TS/Next.js | ~198 commits, **não mantido** (~250★) | **Referência arquitetural**: plataforma 3-lados (cliente/restaurante/entregador), workflow Medusa 2.0 + SSE realtime + módulos custom (Restaurant/Driver/Delivery). **Não é starter.** |
| `rasa-roustaei/restaurant-food-delivery` | github.com/rasa-roustaei/restaurant-food-delivery | — | Django/React | incerto | **Descartar** (stack Python) |
| `aminur93/restaurant-uber-eats-delivery-system` | github.com/aminur93/restaurant-uber-eats-delivery-system | — | Laravel | 2026, 0★ | **Descartar** (PHP; mas bom exemplo de webhook HMAC + Uber Direct) |

**Observação:** não encontrei projetos OSS maduros de *roteirização/dispatch* além do Fleetbase que sejam agnósticos e em Node. Alternativas (Onfleet, Bringg, Tookan, Detrack) são **SaaS proprietários**. Para roteirização pura em OSS há OSRM/VROOM (motores, não sistemas) — fora do escopo desta lista, mas citáveis se precisar.

---

## 3. Pagamentos no Brasil (PIX, MP, PagSeguro, Efí, Asaas, Stripe)

### 3.1 PIX — geração de BR Code (payload EMV/QR)

| Repo | URL | Licença | Lang | Atividade | O que oferece | Recomendação |
|---|---|---|---|---|---|---|
| **`hiagodotme/gpix`** | github.com/hiagodotme/gpix | MIT | TS/JS | ~47 commits (2020+) | Gera BR Code **estático e dinâmico** + QR (base64/arquivo). API fluente (`PIX.static()...`). | **Adotar** — limpo, TS, cobre estático e dinâmico |
| **`joseviniciusnunes/qrcode-pix`** | github.com/joseviniciusnunes/qrcode-pix | MIT | TS | ~66 commits, spec v3.0.2 | Gera payload + QR base64. Interface simples. | **Adotar** — alternativa madura, boa doc de spec Bacen |
| `NascentSecureTech/pix-qrcode-utils` | github.com/NascentSecureTech/pix-qrcode-utils | MIT | TS | 53 commits | Monorepo: create/parse/validate EMV Merchant QR + pix-payload assinado. | **Referência** — parsing/validação robusta |
| `rafaellaurindo/pix-qrcode` | github.com/rafaellaurindo/pix-qrcode | MIT | TS | 4 commits, estagnado | Gerador de BR Code. | **Descartar** (imaturo) |
| `@dicascripto/pix-qrcode-generator` | npm | MIT | JS | 2025, ~0 downloads | Gerador QR PIX EMV. | **Descartar** (baixa adoção, sem types) |

> **Nota técnica:** para PIX **cobrança dinâmica de verdade** (com `txid`, location/URL do PSP, conciliação), o BR Code sozinho não basta — você precisa do **PSP** (Efí, Mercado Pago, Asaas, PagBank, Gerencianet etc.) via API + webhook. As libs acima servem para o **PIX estático/QR local**; o dinâmico vem do PSP.

### 3.2 PSPs / gateways — SDKs Node/TS

| Repo / Pacote | URL | Licença | Oficial? | Lang | Atividade | Recomendação |
|---|---|---|---|---|---|---|
| **`mercadopago/sdk-nodejs`** (`mercadopago`) | github.com/mercadopago/sdk-nodejs | MIT | ✅ **Oficial** | TS | **Muito ativo** (~1.165 commits; npm 3.2.0, ~156k downloads/semana) | **ADOTAR** — você já tem; cobre PIX, cartão, Orders, webhooks assinados |
| **`efipay/sdk-node-apis-efi`** | github.com/efipay/sdk-node-apis-efi | MIT | ✅ **Oficial (Efí/Gerencianet)** | JS/TS (types inclusos) | ativo (~349 commits; npm 2.0.1; 26★) | **ADOTAR** — melhor SDK PIX oficial em Node: QR, copia-e-cola, webhooks, mTLS, Open Finance |
| `efipay/sdk-typescript-apis-efi` | github.com/efipay/sdk-typescript-apis-efi | MIT | ✅ Oficial | TS | ativo | **Adotar** se quiser SDK 100% TS (vs. o Node acima) |
| `mercadopago/pix-payment-sample-node` | github.com/mercadopago/pix-payment-sample-node | MIT | ✅ Oficial | JS | 2021, 5 commits | **Referência** (exemplo PIX via Checkout API) |
| **PagSeguro/PagBank (Node)** | — | — | ❌ **Sem SDK oficial Node** | — | — | **Nenhum oficial.** Ver abaixo |
| `alanhoff/node-pagseguro` | github.com/alanhoff/node-pagseguro | (sem licença clara) | ❌ comunitário | JS | ~116★ mas **2012**, legado | **Descartar** (API antiga, sem licença) |
| `wchagas/pagseguro-node` | github.com/wchagas/pagseguro-node | MIT | ❌ comunitário | JS | 69★, 2019, parado | **Descartar** / referência fraca |
| `JonathanLemes/PagSeguro-Payment` | github.com/JonathanLemes/PagSeguro-Payment | — | ❌ comunitário | JS | 6★, 2020 | **Descartar** |
| Asaas (Node/TS) | vários — ver abaixo | — | ❌ **Sem SDK oficial Node** | TS | imaturos | **Descartar por ora** (use REST direto) |
| Stripe BR | `stripe-node` / `SummerFans/medusa-plugin-payments` | MIT | ✅ Stripe oficial | TS | muito ativo | **Adotar** para cartão internacional (Stripe tem provider nativo Medusa) |

**Asaas — detalhe (comunitários, todos imaturos):**
- `eziocm/asaas-sdk` (MIT, TS, 2026, 10 commits) — o mais "completo" (13 módulos), mas **novíssimo**.
- `migtibincoski/asaas-js-sdk` (MIT, 38 commits, 1★) — README diz "not yet available for use".
- `vinikrausche/asaas-sdk` (2 commits, 2026) — só customers/subscriptions.
- `davevilela/asaas-node-sdk` (MIT, 8 commits, 5★) — auto-gerado de OpenAPI (Bun).
- `gusnips/asaas` (MIT, 16 commits) — ~7 downloads/semana.

→ **Nenhum SDK Asaas é oficial nem maduro.** Se usar Asaas, **chame a REST API v3 direto** (a doc deles é boa) em vez de depender de um SDK de 2 commits.

**PagBank/PagSeguro:** a org oficial `pagseguro` publica SDKs em **PHP, Java, Ruby, C#, Kotlin, Obj-C** — **não há Node/TS oficial**. Existe `pagseguro/plugpag` (Bluetooth, Android). Para Node, você teria que escrever o client (API v4 do PagBank tem REST).

**`Iniciador-de-Pagamentos/iniciador-sdk-node`** — SDK de *iniciação de pagamento* (open finance), 6★, ~2024, MIT. **Referência** se for o caso de uso Open Finance; não é gateway.

---

## 4. Integrações de e-commerce/pagamento para Medusa v2 (mercado BR)

| Plugin | URL | Licença | Oficial? | Atividade | O que oferece | Recomendação |
|---|---|---|---|---|---|---|
| **`marcosgomesneto/medusa-payment-mercadopago`** | github.com/marcosgomesneto/medusa-payment-mercadopago | (verificar) | ❌ comunitário | ~30★, 17 commits, 2024 | Checkout transparente MP: **cartão + PIX**, webhooks com validação. README diz "versão Medusa 2.0 em breve". | **Referência** (confirmar se já é v2) |
| **`NicolasGorga/medusa-payment-mercadopago`** | github.com/NicolasGorga/medusa-payment-mercadopago | MIT | ❌ comunitário | ~30★, 73 commits, **ativo** | Provider **Medusa v2** via Checkout API, webhook, saved cards, subscriptions. ⚠️ README: "WIP, testado só cartão no Uruguai". | **Referência** (promissor, mas não BR-hardened) |
| **`@hewsos/medusa-pay-mpago`** | medusajs.com/integrations/@hewsosmedusa-pay-mpago | (verificar) | ❌ comunitário | **novo (2026)**, listado no site Medusa | **Medusa v2** MP **para o Brasil**: cartão + **parcelamento**, **PIX com QR/countdown/desconto**, webhooks HMAC, refund sync, UI admin pt-BR. | **Adotar/candidato nº1** — feito para BR em Medusa v2 |
| **`@novamoney/nova-pay`** | medusajs.com/integrations/@novamoney-nova-pay | (verificar) | ❌ comunitário | listado no site | Provider Medusa v2: **PIX + Boleto + cartão** + product sync. | **Referência** (avaliar maturidade) |
| `minskylab/medusa-payment-mercadopago` | github.com/minskylab/medusa-payment-mercadopago | MIT | ❌ comunitário | ~48★, 26 commits, **2022 (Medusa v1)** | MP Checkout Pro p/ Medusa v1. | **Descartar** (v1) |
| `SummerFans/medusa-plugin-payments` | github.com/SummerFans/medusa-plugin-payments | — | ❌ | 2025 | Stripe + PayPal p/ Medusa v2. | **Referência** (não é BR) |
| Stripe nativo Medusa | docs.medusajs.com | MIT | ✅ | ativo | Provider oficial Stripe (Medusa v2). | **Adotar** se usar Stripe |

> ⚠️ **Atenção aos plugins "community"**: são mantidos por 1 pessoa, testados em cenários estreitos (muitos citam Uruguai/Argentina). **Valide PIX real + parcelamento + webhook em produção com sandbox antes de adotar.** O `@hewsos/medusa-pay-mpago` é o único que se anuncia explicitamente **BR-first** (pt-BR, PIX, parcelamento, CPF).

---

## 5. WhatsApp / notificação de pedido

| Repo | URL | Licença | Oficial? | Lang | Atividade | O que oferece | Recomendação |
|---|---|---|---|---|---|---|---|
| **`evolution-foundation/evolution-api`** | github.com/evolution-foundation/evolution-api | Apache-2.0 | ❌ comunitário (fundação) | Node/TS | **Muito ativo** (~1.900+ commits) | REST API WhatsApp multiusuário: Baileys (WhatsApp Web) **e** Cloud API oficial; integra Typebot/Chatwoot/n8n/OpenAI/RabbitMQ/SQS/S3. | **Adotar como serviço** — é o padrão de fato no BR |
| **`WhiskeySockets/Baileys`** | github.com/WhiskeySockets/Baileys | MIT | ❌ comunitário | TS | **Muito ativo** | Biblioteca WebSocket do WhatsApp Web (base da Evolution). Multi-device. | **Adotar** se quiser embutir direto no Node (sem serviço extra) |
| `Abdodiab2005/whatsapp-api` | github.com/Abdodiab2005/whatsapp-api | MIT | ❌ | Node | 2025/26 | REST WhatsApp self-hosted sobre Baileys (rate limit, idempotência, Docker). | **Referência** |
| `@crysnovax/baileys` | npm | — | ❌ | Node | — | Wrapper Baileys com recursos extras. | **Referência** |

> ⚠️ **Risco legal/operacional:** Baileys é **não-oficial** (WhatsApp Web). A Meta pode **banir o número**. A própria doc avisa. Para **notificação de pedido em produção**, prefira a **WhatsApp Cloud API oficial** (a Evolution API também suporta) ou aceite o risco com número dedicado + rate limiting.

---

## 6. Tabela comparativa consolidada (adotar / referência / descartar)

| Repo | Subárea | Oficial | Licença | Lang | Atividade | Veredito |
|---|---|---|---|---|---|---|
| `mercadopago/sdk-nodejs` | Pagamento MP | ✅ | MIT | TS | altíssima | ✅ **ADOTAR** |
| `efipay/sdk-node-apis-efi` | PIX PSP | ✅ | MIT | TS | alta | ✅ **ADOTAR** |
| `fleetbase/fleetbase` (+fleetops/navigator/sdk) | Logística | ❌ | AGPL-3.0 | TS/JS | alta | ✅ **ADOTAR** (cuidar AGPL) |
| `hiagodotme/gpix` / `joseviniciusnunes/qrcode-pix` | PIX BRCode | ❌ | MIT | TS | média | ✅ **ADOTAR** |
| `evolution-foundation/evolution-api` | WhatsApp | ❌ | Apache-2.0 | TS | alta | ✅ **ADOTAR** (risk ban) |
| `@hewsos/medusa-pay-mpago` | Medusa BR | ❌ | ? | TS | nova | 🟡 **ADOTAR/avaliar** BR-first |
| `theYahia/ifood-mcp` | iFood | ❌ | MIT | TS | nova | 🟡 **REFERÊNCIA** (código TS útil) |
| `medusajs/medusa-eats` | Food delivery | ✅ Medusa | MIT | TS | não mantido | 🟡 **REFERÊNCIA arquitetural** |
| `NicolasGorga`/`marcosgomesneto` medusa-mp | Medusa BR | ❌ | MIT | TS | média | 🟡 **REFERÊNCIA** |
| `NascentSecureTech/pix-qrcode-utils` | PIX parse | ❌ | MIT | TS | média | 🟡 **REFERÊNCIA** |
| `WhiskeySockets/Baileys` | WhatsApp | ❌ | MIT | TS | alta | 🟡 **REFERÊNCIA/base** |
| `haefrain/delivery-orders-hub` | Agregadores | ❌ | MIT | NestJS | showcase | 🟡 **REFERÊNCIA** |
| `open-ifood/node-sdk` | iFood | ❌ | MIT | TS | estagnado | 🔴 **DESCARTAR** (dep.) |
| `open-ifood/sdk` | iFood | ❌ | BSD-3 | Java | 0★ | 🔴 **DESCARTAR** |
| `arxdsilva/golang-ifood-sdk` | iFood | ❌ | MIT | Go | 2021 | 🔴 **DESCARTAR** |
| Asaas SDKs comunitários (`eziocm`, `migtibincoski`, `davevilela`, `gusnips`, `vinikrausche`) | Pagamento | ❌ | MIT | TS | imaturos | 🔴 **DESCARTAR** (usar REST) |
| PagSeguro Node (`alanhoff`, `wchagas`, `JonathanLemes`) | Pagamento | ❌ | variada | JS | 2012-2020 | 🔴 **DESCARTAR** |
| `luisescosta/goomer-api` | Agregador | ❌ | — | PHP | 1★ | 🔴 **DESCARTAR** |
| `minskylab/medusa-payment-mercadopago` | Medusa | ❌ | MIT | TS | v1/2022 | 🔴 **DESCARTAR** |

---

## 7. Recomendação final — top 5 por subárea com encaixe Medusa/Node

### iFood / agregadores
1. **Seu próprio client `ifood.ts`** (OAuth2 `client_credentials`, polling 30s + acknowledgment, Order/Catalog/Merchant APIs). *Não existe SDK oficial.*
2. **`theYahia/ifood-mcp`** como referência TS do fluxo atual (pedidos, catálogo v2). ⚠️ endpoints de ack/cancel não verificados.
3. **Padrão adapter por agregador** (inspirado em `delivery-orders-hub`) para 99Food/Rappi — cada um via REST própria.

### Logística
1. **Fleetbase FleetOps + Navigator App** como motor de despacho/tracking, integrado por REST/webhooks ao Medusa. ⚠️ **AGPL — valide o modelo de uso.**
2. **`medusajs/medusa-eats`** como blueprint de workflow Medusa 2.0 de 3 lados (cliente/restaurante/entregador) + SSE.
3. SDK `@fleetbase/sdk` para a cola de integração em Node.

### Pagamentos
1. **`mercadopago/sdk-nodejs`** (já instalado) para MP — PIX + cartão + parcelamento.
2. **`efipay/sdk-node-apis-efi`** para PIX/cobrança com PSP oficial (webhooks, mTLS).
3. **`gpix`** ou **`qrcode-pix`** para BR Code local (PIX estático/dinâmico offline).
4. **PagBank/Asaas:** sem SDK oficial Node — **implemente REST direto** (não adote os SDKs de 2-16 commits).

### Medusa (gateway BR)
1. **`@hewsos/medusa-pay-mpago`** — único plugin Medusa v2 explicitamente BR-first (PIX QR + parcelamento + pt-BR). Valide em sandbox.
2. **`@nicogorga/medusa-payment-mercadopago`** / **`@novamoney/nova-pay`** como alternativas.
3. **Stripe** (provider oficial Medusa) para cartão internacional.

### WhatsApp/notificação
1. **Evolution API** (serviço separado, REST) — suporta Baileys **e** Cloud API oficial.
2. **WhatsApp Cloud API oficial** para notificação de pedido em produção (evita ban do Baileys).
3. **Baileys** direto se quiser embutir no Node sem serviço extra.

---

## 8. Riscos e pontos de atenção (honestidade)

1. **iFood não tem SDK oficial Node** — o coração da sua integração será código seu. Os SDKs comunitários são pequenos/estagnados (0-1★) ou em outra linguagem.
2. **Fleetbase é AGPL-3.0** — self-host OK; SaaS modificado exige abrir código (ou licença comercial). **Decisão jurídica, não técnica.**
3. **Plugins Medusa BR são todos comunitários** — 1 mantenedor, testes estreitos (Uruguai/Argentina). **Teste PIX/parcelamento/webhook em sandbox antes de produção.**
4. **Asaas/PagBank sem SDK oficial Node** — prefira REST direto a SDKs de poucos commits e downloads ~0.
5. **Baileys/Evolution (WhatsApp Web) pode banir número** — use Cloud API oficial para produção.
6. **Estrelas/datas são snapshot** — revalide antes de decidir; alguns repos mudam de licença.
7. **`ifood/ifood-merchant-api-examples` deu 404** — não confirme como público.

---

*Relatório gerado por pesquisa web + verificação direta nas páginas públicas. Onde a leitura direta falhou (ex.: rate-limit da API do GitHub), os números vêm das páginas do GitHub/npm e podem variar levemente.*
