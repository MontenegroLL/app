# 📊 Rastreamento Geral de Sprints (Sprint Tracker)

Documento vivo para acompanhamento do progresso técnico das fases do projeto.

---

## 🏁 Status Geral das Fases

```text
[🟢 Concluído]   Setup Base, White-Label & Localização BRL
[🟡 Em Andamento] Fase 1: Arquitetura Core e Modelagem (Food Service Data Models)
[⚪ Planejado]    Fase 2: O Motor do Salão e PDV Touch (Frente de Caixa)
[⚪ Planejado]    Fase 3: Operação de Cozinha (KDS em Tempo Real)
[⚪ Planejado]    Fase 4: Omnicanalidade, iFood & Fleetbase Logistics
[⚪ Planejado]    Fase 5: Dashboard do Proprietário & Métricas
```

---

## 📌 Detalhamento das Etapas

### 🟢 Etapas Concluídas (Foundation & Base)
- [x] **Configuração Monorepo & Infraestrutura Inicial**:
  - Banco de Dados PostgreSQL conectado via **Supabase**.
  - Servidores Medusa Backend (`port: 9000`) e Storefront Next.js (`port: 8000`) operacionais.
- [x] **Arquitetura White-Label Dinâmica**:
  - Injeção de marca (`NEXT_PUBLIC_RESTAURANT_NAME`, `NEXT_PUBLIC_LOGO_URL`, `NEXT_PUBLIC_PRIMARY_COLOR`) via `.env`.
  - CSS Variables (`--brand-color`) no Tailwind e Root Layout do Storefront.
  - Customização da tela de login e branding no Medusa Admin.
- [x] **Localização e Moeda Estrita (BRL / Brasil)**:
  - Cauterização de moedas no banco: apenas **BRL** ativa e padrão (`is_default: true`).
  - Região **Brasil** configurada com impostos locais e provedores de pagamento.
  - Remoção completa de seletores de país/região da interface do Storefront.
  - Formatação forçada em `pt-BR` (`R$ 15,00`).
- [x] **Segurança Visual do Medusa Admin**:
  - Ocultação via CSS estático (Vite) e Widget runtime dos menus e links fiscais/macro (`/settings/regions`, `/settings/tax-regions`, `/settings/locations`).
- [x] **Motor Base do iFood (Hub Agregador)**:
  - Serviço `IfoodService` (`apps/backend/src/services/ifood.ts`) com autenticação OAuth2, cache de token e polling.
  - Job Agendado a cada 30 segundos (`apps/backend/src/jobs/ifood-polling.ts`) pronto para interceptar eventos `PLC` (Placed Order).

---

### 🟡 Fase 1: Arquitetura Core e Modelagem (Food Service) — *Sprint Atual*
*Meta: Capacitar o banco de dados do Medusa para o vocabulário de restaurantes (Adicionais, Mesas, Comandas).*
- [ ] **Módulo `restaurant` no Medusa v2**:
  - [x] Criar modelo DML `ModifierGroup` (Nome, Mínimo, Máximo, Obrigatório, Vínculo de Produto).
  - [x] Criar modelo DML `Modifier` (Nome, Preço adicional em BRL, Default, Quantidade Máxima por Item).
  - [x] Criar modelo DML `RestaurantTable` (Número/Identificador da Mesa, Capacidade, Status, QR Code Token).
  - [x] Criar modelo DML `Tab` (Comanda/Conta Aberta, Vínculo com Mesa, Nome do Cliente, Status).
- [ ] **Migrations & Registro**:
  - [x] Registrar o módulo `restaurant` no `medusa-config.ts`.
  - [x] Executar migrations no Supabase PostgreSQL.
- [ ] **Extensão do Carrinho (Cart & Order Items)**:
  - [x] Permitir anexar modificadores selecionados aos itens do carrinho via metadata estruturado (hook `add-to-cart` + rota `POST /store/carts/:id/restaurant-items`).
  - [x] Associar o carrinho a uma Mesa (`table_id`) ou Comanda (`tab_id`) (hook `create-cart` + rotas `store/restaurant/tables|tabs`).
- [x] **Admin UI Food Service (Medusa Admin v2)**:
  - [x] Rotas `GET/POST /admin/restaurant/tables`, `GET/PUT /admin/restaurant/tables/:id` e `GET /admin/restaurant/tables/:id/qr-code`.
  - [x] Rotas de grupos: `GET/POST /admin/restaurant/modifier-groups`, `GET/PUT /admin/restaurant/modifier-groups/:id`, `POST /admin/restaurant/modifier-groups/:id/modifiers`.
  - [x] Páginas `Salão & Mesas` e `Modificadores` no menu lateral (`src/admin/routes`).
  - [x] Verificação `verify-admin-restaurant-routes.ts` → 21/21 PASS.

---

### ⚪ Fase 2: O Motor do Salão e PDV Touch (Semanas 4-6)
- [ ] API de Contas Abertas (adicionar itens à mesa, transferência entre mesas, split payment).
- [ ] Front-end do PDV (App PWA dedicado para telas touch com layout em grid de categorias).
- [ ] Atalhos de teclado para operação rápida e checkout expresso (PIX dinâmico e cartão).
- [ ] Modo de sobrevivência offline-first com persistência em IndexedDB.

---

### ⚪ Fase 3: Operação de Cozinha (KDS) em Tempo Real (Semanas 7-8)
- [ ] EventBus & Redis Pub/Sub para eventos `order.placed`, `order.item_updated`, `order.item_prepared`.
- [ ] Servidor WebSocket para streaming de pedidos para a cozinha.
- [ ] Front-end do KDS (Interface escura com raias de produção e cartões com cronômetro visual).

---

### ⚪ Fase 4: Omnicanalidade & Fleetbase (Semanas 9-11)
- [ ] Injeção de pedidos do iFood diretamente no carrinho/pedido do Medusa.
- [ ] Integração REST/Webhook com o **Fleetbase Engine** para despacho e alocação de entregadores ao emitir `order.ready_for_pickup`.
- [ ] Cardápio Digital QR Code PWA para o cliente na mesa.

---

### ⚪ Fase 5: Dashboard do Proprietário & Métricas (Semanas 12+)
- [ ] Painel analítico com tempo médio de preparo por raia.
- [ ] Comparativo de vendas por canal (Salão vs Delivery Próprio vs iFood).
- [ ] Gestão de margem e mapa de calor de vendas.
