# Pesquisa de Repositórios Open-Source — KDS, Impressão Térmica e Fiscal Brasileira

> **Projeto alvo:** PDV/Food Service brasileiro — Backend Medusa.js v2 (Node/TS + PostgreSQL/Supabase), Frontend Next.js, real-time com Redis Pub/Sub + WebSocket.
> **Data da pesquisa:** 19/10/2026
> **Método:** Dados verificados via GitHub API (`/repos`) e páginas de repositório (`webfetch`) + websearch. Estrelas/datas são as observadas na data da coleta; valores aproximados estão marcados com "~".

---

## 0. Sumário executivo (TL;DR)

Nenhum projeto open-source pronto "encaixa" diretamente no stack Medusa v2 + Next.js como KDS drop-in. O caminho de **maior valor e menor risco** é **montar** o KDS/impressão combinando bibliotecas maduras e pequenas:

| Camada | Recomendação primária | Licença |
|---|---|---|
| **Geração de comanda (encoding)** | `at-point-of-sale/ReceiptPrinterEncoder` | MIT |
| **Envio à impressora (rede)** | `at-point-of-sale/NetworkReceiptPrinter` (Node/TCP 9100) | MIT |
| **Envio à impressora (servidor, multi-porta)** | `Klemen1337/node-thermal-printer` | MIT |
| **Envio à impressora (browser, sem agente)** | `@point-of-sale/webusb/webserial/webbluetooth-receipt-printer` + `qzind/tray` (fallback) | MIT / ver §4.4 |
| **Layout de comanda em Markdown** | `receiptline/receiptline` + `receiptline/receiptio` | Apache-2.0 |
| **Referência de KDS (arquitetura real-time)** | `satisfecho/pos` (FastAPI + Redis pub/sub + WS, KDS/Bar reais) | AGPL-3.0 |
| **Referência de KDS (stack TS/React)** | `mighty840/kitchenasty` (KDS Kanban, Socket.IO) | MIT |
| **Fiscal BR (NFC-e/NF-e em Node)** | `@fiscal-rs/node` (Rust→NAPI) ou API comercial (NFE.io, NS Tecnologia) | MIT |
| **Fiscal BR — SAT/EPEC (hardware)** | **NÃO há lib open-source em Node confiável** — trata-se de SDK/DLL do fabricante (ver §5) | comercial |

**Conclusão fiscal resumida:** NFC-e/NF-e (documento eletrônico enviado à SEFAZ) **é viável open-source em Node** (fiscal-rs, node-nfe-nfce). Já o **SAT (CF-e-SAT)** e o **EPEC** dependem de **DLL/SDK do fabricante do equipamento** (ex.: Bematech/Elgin/Daruma/Gertec) e de homologação — na prática é **comercial** (ACBr via ponte, ou API de terceiros). Detalhes em §5.

---

## 1. Impressão térmica / ESC-POS em Node.js e Browser

### Tabela comparativa — bibliotecas de impressão

| Repositório | URL | Licença | Lang | Estrelas | Último commit (aprox.) | O que oferece | Veredito |
|---|---|---|---|---|---|---|---|
| **at-point-of-sale/ReceiptPrinterEncoder** | https://github.com/at-point-of-sale/ReceiptPrinterEncoder | MIT | JS/TS | ~334 | 18/09/2026 | Encoda recibo em **ESC/POS, StarLine, StarPRNT** (texto, tabelas, QR, barcode, imagens). Roda em **browser e Node**. Ex-`EscPosEncoder`. | ✅ **ADOTAR** (camada de encoding) |
| **Klemen1337/node-thermal-printer** | https://github.com/Klemen1337/node-thermal-printer | MIT | JS/TS | ~916 | 24/08/2026 | Cliente **server-side** multi-marca (Epson, Star, Daruma, Bematech MP-4200, Elgin i8, Brother, Custom). Interfaces: `tcp://ip:9100`, `printer:Nome` (driver do SO), `\\.\COM1` (serial). API rica (tabelas, cortes, gaveta, beep, QR, imagens). | ✅ **ADOTAR** (impressão servidor/lan house) |
| **lsongdev/node-escpos** | https://github.com/lsongdev/node-escpos | NOASSERTION (MIT-like) | TS | ~1.579 | 13/09/2024 | Driver ESC/POS Node.js, muito popular historicamente. | ⚠️ **REFERÊNCIA** — commits antigos; ver alternativa abaixo |
| **node-escpos/driver** (@node-escpos) | https://github.com/node-escpos/driver | NOASSERTION (MIT-like) | TS | ~374 | 04/07/2024 | Sucessor do `lsongdev/node-escpos`. Monorepo com **adapters** (USB, network, serial, bluetooth) e pacote `@node-escpos/server` (servidor de impressão). | ⚠️ **REFERÊNCIA** — bom design, mas último commit 2024; issue abertas altas |
| **receiptline/receiptline** | https://github.com/receiptline/receiptline | Apache-2.0 | JS | ~776 | 31/07/2026 | "Markdown para recibos": layout declarativo → comandos ESC/POS/StarPRNT ou SVG/PNG. Muito usado para **templates de comanda**. | ✅ **ADOTAR** (templates) |
| **receiptline/receiptio** | https://github.com/receiptline/receiptio | Apache-2.0 | JS | ~108 | 29/07/2026 | **Aplicação de impressão Node.js** completa sobre receiptline: lê Markdown, envia por IP/serial/USB, **retorna status da impressora** (papel, tampa, offline, gaveta). Suporta Epson TM, Star MC, Citizen CT, SII RP. Gera PNG/SVG sem impressora (ótimo p/ testes). | ✅ **ADOTAR** (agente de impressão pronto) |
| **receipt-print-hq/escpos-printer-db** | https://github.com/receipt-print-hq/escpos-printer-db | CC-BY-4.0 | Python/JSON | ~148 | 19/10/2026 | **Base de dados** de capacidades de impressoras ESC/POS (code pages, largura, comandos). Útil p/ autodetecção e suporte a modelos brasileiros. | ✅ **ADOTAR** (dados de suporte) |
| **mike42/escpos-php** | https://github.com/mike42/escpos-php | NOASSERTION (MIT) | PHP | ~2.799 | 08/08/2026 | Referência histórica em PHP. **Não usar em Node**, mas a **lista de code pages/comandos** e os manuais são excelentes referências. | 📚 **REFERÊNCIA** (documentação) |
| **nfephp-org/posprint** | https://github.com/nfephp-org/posprint | LGPLv3/GPLv3/MIT | PHP | ~72 | (ver nota) | API de impressão POS focada no **mercado brasileiro** (Epson TM-T20, Daruma DR700, Bematech MP-4200 TH, Elgin Vox, Sweda SI-300). **AVISO no README: fase alpha, "NÃO É FUNCIONAL".** | ❌ **DESCARTAR como código**; usar apenas como **mapa de modelos brasileiros** |

> **Nota de incerteza:** datas de commit do `posprint` não foram confirmadas na página; o README declara explicitamente estado alpha/não funcional — não confiar em produção.

### 1.1 Padrão de arquitetura para impressão (recomendado)

```
Medusa v2 (Node/TS)
   │  evento: pedido confirmado / item para cozinha
   ▼
"Print Service" (worker Node separado ou módulo Medusa)
   │  1. Recebe payload do pedido
   │  2. ReceiptPrinterEncoder / receiptline  → bytes ESC/POS
   │  3. Roteia por estação (cozinha / bar / caixa)
   ▼
Fila de impressão (Redis / BullMQ)  ──► Retry + idempotência
   │
   ├── Impressora de rede (Ethernet/WiFi, porta 9100) → NetworkReceiptPrinter / node-thermal-printer
   ├── Impressora USB/serial no servidor          → node-thermal-printer
   └── Impressora local do navegador (sem agente) → WebUSB/WebSerial ou QZ Tray
```

**Por que fila + serviço separado:** impressoras falham (papel, offline, rede). A fila (BullMQ sobre Redis, que você já terá) garante **retry**, **ordem por estação** e **observabilidade** — sem travar o checkout do Medusa. Isso é o "printing queue" que os projetos prontos não entregam de fábrica.

---

## 2. KDS (Kitchen Display System) open-source

**Realidade do nicho:** projetos de KDS são **pequenos e fragmentados**. A maioria tem <60 estrelas e é MVP acadêmico. Não há um "KDS open-source consolidado" como há POS (ex.: Odoo POS, ERPNext). Portanto: **adote padrões/arquitetura, não o código inteiro** — exceto se for aceitar um fork de stack diferente.

### Tabela comparativa — KDS e POS com KDS

| Repositório | URL | Licença | Lang | Estrelas | Último commit (aprox.) | O que oferece | Veredito |
|---|---|---|---|---|---|---|---|
| **satisfecho/pos** | https://github.com/satisfecho/pos | AGPL-3.0 | Python/TS/Angular | ~57 | Ativo (10.5k commits) | POS self-hosted multi-tenant **com KDS e Bar display reais** (`/kitchen`, `/bar`). Arquitetura **idêntica à sua**: Angular→FastAPI→Postgres, **Redis pub/sub → WebSocket bridge**. Ciclo de pedido (pending→preparing→ready), taxa de IVA, mesas/QR, reservas, Stripe/Revolut. | ✅ **REFERÊNCIA #1 de arquitetura** (não adotar código AGPL; copiar **padrões** WS+fila) |
| **mighty840/kitchenasty** | https://github.com/mighty840/kitchenasty | MIT | TS (Express/React/Prisma) | ~58 | 2026 (ativo, 76 commits) | **KDS como Kanban** com progressão de status em 1 clique, **Socket.IO** em tempo real, monorepo TS, i18n (inclui **Português**), 350+ testes, Docker. MIT = permissivo. | ✅ **REFERÊNCIA #2 / base de UI** (MIT permite reuso; stack React) |
| **ury-erp/ury** (+ `ury-erp/mosaic`) | https://github.com/ury-erp/ury · `mosaic` | AGPL-3.0 | Python (Frappe/ERPNext) | ~47 (mosaic) | mosaic **descontinuado**; consolidado em `ury-erp/ury` | KDS/KOT completo, multi-cozinha, produção por estação. Rodou em 10+ outlets. | 📚 **REFERÊNCIA** de features de KDS (routing por estação, KOT). Código Frappe ≠ seu stack |
| **frappe/erpnext** | https://github.com/frappe/erpnext | GPL-3.0 | Python | (muitas, ~25k+) | Ativo | ERP completo com POS restaurante, KOT, filas de fulfillment. Gigante. | 📚 **REFERÊNCIA** (conceito KOT/roteamento). Não encaixa |
| **ahmedali5530/restaurant-pos** | https://github.com/ahmedali5530/restaurant-pos | (verificar) | TS/React + SurrealDB | (baixo) | Ativo (2026) | POS + KDS em React, multi-estágio, roteamento por estação, tracking em tempo real. Stack web moderna. | 👀 **REFERÊNCIA de UI/UX** (verificar licença antes de reusar) |
| **NewPointe/KitchenView** | https://github.com/NewPointe/KitchenView | MPL-2.0 | TS | ~13 | **ARQUIVADO (abril/2021)** | KDS para Square POS: filtros por estação, muitos screens. | ❌ **DESCARTAR** — **arquivado/abandonado** |
| **BenClementt/OpenKDS** | https://github.com/BenClementt/OpenKDS | GPL-3.0 | Node/EJS | ~12 | 23/03/2023 | KDS Node.js com API + Web UI — **conceitualmente próximo ao seu stack**. | ⚠️ **REFERÊNCIA** — parado desde 2023; pouco ativo |
| **Raktim94/nodedr-restaurant-pos** | https://github.com/Raktim94/nodedr-restaurant-pos | AGPL-3.0 | NestJS/Next.js/Postgres | ~3 | 19/10/2026 (ativo) | POS restaurante self-hosted: **NestJS + Next.js + Postgres** (stack bem próxima), KDS, offline-first. Muito novo/poucas estrelas. | 👀 **OBSERVAR** — stack alinhada, mas imaturo (3★) |
| **calvincchong/FoodStreams** | https://github.com/calvincchong/FoodStreams | (sem licença) | JS | ~13 | 2023 | MVP de KDS de restaurante. | ❌ **DESCARTAR** — MVP parado, sem licença |
| **BenClementt/OpenKDS / DavidVidaurre/kds-app** | (ver acima) | GPL-3.0 / sem licença | EJS / TS | ~12 / ~11 | 2023 | KDS pequenos. | ❌ **DESCARTAR** |
| **getditto/demoapp-pos-kds** | https://github.com/getditto/demoapp-pos-kds | (verificar) | — | (baixo) | — | Demo de **mesh sync P2P offline** POS→KDS. Conceito de resiliência offline. | 📚 **REFERÊNCIA** (conceito offline/LAN) |

### 2.1 Funcionalidades de KDS que você deve construir (checklist)

Baseado no que `satisfecho/pos`, `ury` e `kitchenasty` oferecem:

- **Raias/estações** (grill, fry, salad, bar, expo) com **roteamento por item/categoria**.
- **Cronômetros por ticket e por item** (verde/amarelo/vermelho — "cook timers").
- **Ciclo de status**: `novo → em preparo → pronto → entregue` (bump).
- **Dark UI** de alto contraste p/ cozinha + **som/alerta** de novo pedido.
- **Reconciliação no Expo** (juntar itens de estações diferentes num prato).
- **Resiliência offline/LAN** (WebSocket local + reconexão) — crítico per §2 do awesome-list.
- **Bump bar** (opcional) ou teclado físico p/ mãos engorduradas.

**Encaixe com sua stack:** o **backend Medusa** publica eventos de pedido; **Redis Pub/Sub** (que você já planejou) canaliza para um **WebSocket gateway** (ex.: `ws`/`socket.io` ou o bridge Node), e o **Next.js** consome. Este é literalmente o desenho do `satisfecho/pos` (`Redis pub/sub → ws-bridge → browser`).

---

## 3. Impressão via rede (Ethernet/WiFi) e USB — kits prontos

### 3.1 Suíte `@point-of-sale` (Niels Leenheer) — **a mais completa para browser+Node**

Site: https://point-of-sale.dev — todas **MIT**, do mesmo autor do `ReceiptPrinterEncoder`. Testadas em dezenas de impressoras reais.

| Pacote | URL | Alvo | Envio |
|---|---|---|---|
| `receipt-printer-encoder` | https://github.com/at-point-of-sale/ReceiptPrinterEncoder | Browser + Node | Encoda (ESC/POS/Star) |
| `network-receipt-printer` | https://github.com/at-point-of-sale/NetworkReceiptPrinter | Node/Electron | **TCP socket (porta 9100)** |
| `system-receipt-printer` | (repo at-point-of-sale) | Node/Electron | **Driver do SO** (Windows/Linux/macOS) |
| `webusb-receipt-printer` | https://github.com/at-point-of-sale/WebUSBReceiptPrinter | Browser | **WebUSB** (sem agente!) |
| `webserial-receipt-printer` | https://github.com/at-point-of-sale/WebSerialReceiptPrinter | Browser | **WebSerial** |
| `webbluetooth-receipt-printer` | https://github.com/at-point-of-sale/WebBluetoothReceiptPrinter | Browser | **WebBluetooth** |
| `receipt-printer-renderer` | (repo at-point-of-sale) | Browser/Node | Renderiza recibo → **imagem** |
| `receipt-printer-status` | (repo at-point-of-sale) | Browser/Node | **Status da impressora** |
| `capacitor-*` (network/bluetooth/epson/star/sunmi) | (repos at-point-of-sale) | App mobile | Vários SDKs |

> ⚠️ **Nota de verificação:** as estrelas individuais das libs de envio são **baixas** (ex.: `NetworkReceiptPrinter` ≈ 11★). Isso **não indica abandono** — são bibliotecas pequenas e focadas, mantidas pelo mesmo autor, **atualizadas em 2026** e **MIT**. O valor está no conjunto coerente, não em popularidade individual.

### 3.2 Alternativas de "agente/ponte" para impressão silenciosa via navegador

| Solução | URL | Licença / modelo | Veredito |
|---|---|---|---|
| **qzind/qz-tray** | https://github.com/qzind/tray | **Open-core**: software grátis, **assinatura comercial obrigatória para impressão silenciosa** (certificado QZ Industries). Alternativa: assinar com seu próprio certificado. Java/JRE. ~1.1k★, muito ativo (2026). | ⚠️ **REFERÊNCIA/OPCIONAL** — poderoso e maduro, mas adiciona dependência Java + licenciamento. Prefira WebUSB/servidor Node se possível |
| **WebUSB/WebSerial (at-point-of-sale)** | (acima) | MIT | ✅ **ADOTAR** — impressão direta do navegador **sem instalar agente** (Chromium/Edge; requer HTTPS + gesto do usuário) |
| **Serviço de impressão no servidor (Node)** | `node-thermal-printer` / `receiptio` | MIT / Apache-2.0 | ✅ **ADOTAR** — para impressoras de rede no LAN do estabelecimento |

### 3.3 Considerações práticas de hardware (mercado BR)

- **Impressoras de rede** (Ethernet/WiFi, porta 9100) são o caminho mais robusto para cozinha/bar: sem driver, sem SO, basta IP.
- **USB/serial**: requer driver RAW ou lib (Windows: driver genérico; Linux/macOS: `/dev/usb/lp0`).
- **Modelos comuns no Brasil** testados/documentados: **Epson TM-T20/T88** (via `node-thermal-printer` e `posprint`), **Bematech MP-4200 TH**, **Elgin i8/Vox**, **Daruma DR700/DR800**, **Sweda SI-300**, **Tanca**, **Custom TG2480-H**. O `escpos-printer-db` ajuda com **code pages** (`PC860_PORTUGUESE`, `PC850`, `WPC1252`) — **atenção à acentuação PT-BR**.

---

## 4. Fiscal brasileira: NFC-e / NF-e / SAT / EPEC

### 4.1 O que é open-source de verdade

| Repositório | URL | Licença | Lang | Estrelas | Atividade | O que oferece | Veredito |
|---|---|---|---|---|---|---|---|
| **nfephp-org/sped-nfe** | https://github.com/nfephp-org/sped-nfe | LGPLv3/MIT | PHP | ~1.6k | Muito ativo (2026; adequações RTC/Reforma Tributária) | **A referência brasileira**: geração, assinatura, envio NFe (55)/NFC-e (65), eventos, todos os estados. PHP, não Node. | 📚 **REFERÊNCIA canônica** (spec/regras) |
| **JoaoHenriqueBarbosa/fiscal-rs** | https://github.com/JoaoHenriqueBarbosa/fiscal-rs | MIT | Rust (+ **NAPI Node**) | ~13 | Ativo (263 commits, CI, fuzz) | **Port completo do sped-nfe em Rust**, com binding **Node.js (`@fiscal-rs/node`)** via napi-rs. Cobre **NFC-e QR v2/v3, contingência SVCAN/SVCRS/EPEC**, todos os tributos, mTLS SEFAZ, 1834 testes. ISSO é o mais próximo de "lib fiscal Node confiável e permissiva". | ✅ **ADOTAR (avaliar)** — MIT, Node, moderno. ⚠️ **Jovem (13★, ~0.1)**; validar em homologação |
| **node-nfe-nfce** (npm) | (npm) | (verificar) | Node | — | — | Geração/integração de **NF-e/NFC-e, MDF-e** e **DANFE** em Node. | 👀 **AVALIAR** — confirmar manutenção/licença no npm |
| **node-dfe** (npm) | (npm) | (verificar) | Node | — | 2022 | Eventos de emissão de DF-e modelos 55/65 para todos os estados, síncrono e assíncrono. | 👀 **AVALIAR** — inativo desde 2022 |
| **fm-s/open-nfse** | https://github.com/fm-s/open-nfse | MIT | TS/Node | (baixo) | Ativo | Cliente TS/Node para o **Padrão Nacional de NFS-e** (nfse.gov.br) — obrigatório a partir de 2026. **É NFS-e (serviço), não NFC-e (varejo).** | ✅ **ADOTAR se emitir NFS-e** |
| **NSTecnologia/ns-nfe-node** | https://github.com/NSTecnologia/ns-nfe-node | (verificar) | Node | ~15 | 32 commits | Biblioteca Node para a **API comercial** da NS Tecnologia (não emite localmente). | ⚠️ **REFERÊNCIA** — dependência de API paga |
| **frones/ACBr** | https://github.com/frones/ACBr | (LGPL-ish) | Pascal | ~183 | Ativo | **ACBr**: o framework fiscal brasileiro mais completo (NFe, NFC-e, **SAT**, EPEC, EFD, NFS-e...). É **Pascal/Delphi** — no Node, usa-se via **ponte/comunicação com processo** ou via APIs que o envelopam. | 📚 **REFERÊNCIA CRÍTICA** — padrão de mercado para fiscal no BR |

### 4.2 SAT (CF-e-SAT) — a resposta honesta

**O SAT não é implementável de forma puramente open-source em Node.** Motivos técnicos:

1. O SAT é um **equipamento fiscal certificado** (hardware do fabricante: Bematech, Elgin, Daruma/Gertec, Epson, Sweda). O software fala com ele via **DLL/SDK proprietária do fabricante** (no Windows) ou via protocolo do equipamento.
2. O fabricante fornece **DLL + biblioteca de comunicação** só para sistemas homologados; não há SDK oficial em Node.
3. Emissão exige **certificação/homologação** do desenvolvimento junto à SEFAZ/ao fabricante.

**Como aplicações em Node resolvem hoje (na prática):**
- **API comercial de terceiros** (NFE.io, NS Tecnologia, Focus NFe, PlugNotas) que envelopam SAT/NFC-e/NF-e em REST — **comercial**, mas é o caminho mais rápido e sem dor de homologação de hardware.
- **ACBrMonitor / ACBrLib** rodando como **processo local** (Pascal/Delphi) e a aplicação Node conversa por **socket/txt de comando**. ACBr é open-source, mas o **binário** e a **DLL do SAT** continuam necessários.
- **Calculadora SAT / emissão direta**: inviável genericamente sem a DLL do fabricante.

> **Recomendação fiscal pragmática:**
> - **NFC-e** (modelo 65, documento eletrônico na SEFAZ — usual em restaurantes): **open-source viável** com `@fiscal-rs/node` (+ validar) ou via API comercial. Não há hardware fiscal obrigatório; usa-se certificado A1 e impressão **não-fiscal** da DANFE simplificada/QR.
> - **SAT (CF-e-SAT)**: **comercial** (DLL do fabricante ou API terceirizada). Marcar como **fora do escopo open-source**.
> - **EPEC**: contingência de **NF-e** (não SAT). É tratado pelo sped-nfe/fiscal-rs (EPEC listado como coberto no fiscal-rs) — mas depende de SEFAZ+certificado, não de hardware.

### 4.3 Implicação para o seu PDV

- **Comandas de cozinha/bar/caixa** → **não-fiscais**, ESC/POS puro → libs da §1.
- **Cupom fiscal/NFC-e** → emissão eletrônica (SEFAZ) via `@fiscal-rs/node`/API + impressão da via (QR Code + DANFE simplificada) na mesma térmica. **Separe** a impressão não-fiscal (rápida, ESC/POS) da **emissão fiscal** (com fila e retry próprios).
- **SAT** → só se você for obrigado em algum estado; aí planeje **integração comercial**.

---

## 5. Top recomendações (adoção) e encaixe no stack

### 🥇 Top 5 para **adoção** (montagem recomendada)

1. **`at-point-of-sale/ReceiptPrinterEncoder`** (MIT) — camada de **encoding** ESC/POS/StarLine. Roda no servidor (Medusa) E no browser (Next.js). Ponto único de composição da comanda.
2. **`at-point-of-sale/NetworkReceiptPrinter`** (MIT) + **`Klemen1337/node-thermal-printer`** (MIT) — **transporte** por rede (TCP 9100) e USB/serial no servidor. Cobrem Ethernet/WiFi/USB com `node-thermal-printer` como "canivete suíço" multmarca BR.
3. **`receiptline/receiptline` + `receiptline/receiptio`** (Apache-2.0) — **templates de comanda em Markdown** e **agente de impressão** com **status da impressora** + geração de PNG p/ teste. Rápido de integrar.
4. **Padrões do `satisfecho/pos`** (AGPL — **copiar arquitetura, não código**) — desenho `Redis pub/sub → WS bridge → KDS` idêntico ao seu. Use como **blueprint** do fluxo real-time.
5. **`mighty840/kitchenasty`** (MIT) — **base/UI de KDS** (Kanban, Socket.IO) e referência de UX; MIT permite reaproveitar componentes. Alternativa de referência TS pura.

### 🧩 Como encaixa no Medusa v2 + Next.js + Redis

```
[Next.js PDV] --cria pedido--> [Medusa v2 API] --evento--> [Redis Pub/Sub]
                                    |                              |
                                    | (subscriber)                 v
                                    |                     [WS Gateway (Node)]
                                    v                              |
                          [Fila BullMQ/Redis]                      v
                                    |                       [Next.js KDS / Bar]  (dark UI)
                                    v
                          [Print Service]
                          - ReceiptPrinterEncoder/receiptline -> bytes
                          - roteia por estação (cozinha/bar/caixa)
                          - node-thermal-printer / NetworkReceiptPrinter -> impressora
                                    |
                                    v
                          [Impressora 9100 / USB / WebUSB]
```

- **Módulo Medusa** `print-service` (ou worker Node separado) assina eventos de pedido.
- **BullMQ** (Redis) dá retry/idempotência/ordem por estação — o "printing queue".
- **Next.js** pode imprimir **direto** via WebUSB/WebSerial (perfeito p/ balcão com Chromium) **ou** delegar ao Print Service (rede).
- **KDS** consome o **WS Gateway** (não polling).

### ⚠️ Limitações e riscos (concretos)

1. **Nenhum KDS open-source "drop-in"** para Medusa/Next — espere **construir** a UI (a referência MIT `kitchenasty` ajuda).
2. **AGPL (`satisfecho/pos`, `ury`, `noderd`)**: copiar código AGPL em SaaS fechado **contamina** a licença. Use **apenas como referência de arquitetura**, não copie código.
3. **Fiscal NFC-e em Node é imaturo**: `@fiscal-rs/node` tem 13★/v0.1; valide exaustivamente em **homologação SEFAZ** antes de produção. Para go-live rápido/seguro, considere **API comercial** (NFE.io, Focus NFe, PlugNotas, NS Tecnologia) e migre depois.
4. **SAT é comercial** — não há atalho open-source em Node (DLL do fabricante). Trate como integração de fornecedor.
5. **Impressão silenciosa no browser**: WebUSB/WebSerial exigem **Chromium + HTTPS + gesto**; Firefox/Safari não suportam. Fallback = **agente local** (serviço Node) ou **QZ Tray** (licença comercial p/ silencioso).
6. **Acentuação PT-BR** em térmicas: escolha correta de **code page** (PC860/PC850/WPC1252) — use `escpos-printer-db` e testes com PNG (`receiptio -o x.png`).
7. **Projetos abandonados/arquivados a evitar**: `NewPointe/KitchenView` (arquivado 2021), `calvincchong/FoodStreams` (2023, sem licença), `BenClementt/OpenKDS` (2023), `nfephp-org/posprint` (declarado não funcional), `fm-s/open-nfse` serve para NFS-e (não NFC-e).

---

## 6. Anexo — Fontes verificadas

- GitHub REST API `/repos` (estrelas, licença, `pushed_at`, `archived`) — consultado 19/10/2026.
- Páginas de repositório via webfetch: ReceiptPrinterEncoder, receiptio, NetworkReceiptPrinter, node-thermal-printer, node-escpos/driver, qzind/tray, sped-nfe, fiscal-rs, ns-nfe-node, satisfecho/pos, kitchenasty, ury-erp/mosaic, NewPointe/KitchenView.
- `point-of-sale.dev` (suíte @point-of-sale, MIT).
- Páginas de licenciamento QZ Tray (qz.io/wiki/Licensing e /docs/signing) — modelo open-core, certificado comercial para impressão silenciosa.
- Buscas web: KitchenAsty (dev.to/Product Hunt), fiscal Node (npm), awesome-list KDS (`ishandutta2007/Awesome-Kitchen-Display-System`).

> **Valores marcados "~" ou sem data confirmada** (ex.: `posprint`, licenças `NOASSERTION`, `node-nfe-nfce`, `ahmedali5530/restaurant-pos`) devem ser **reconfirmados** diretamente no repositório antes de qualquer decisão de adoção.
