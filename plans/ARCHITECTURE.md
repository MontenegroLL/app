# 🏛️ Mapeamento de Arquitetura da Plataforma

Nossa plataforma foi concebida para substituir sistemas legados de PDV/Food Service (como Saipos), utilizando uma arquitetura moderna, distribuída, orientada a eventos e com foco em código aberto e custos operacionais mínimos.

---

## 1. Topologia da Arquitetura

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLOUDFLARE (EDGE)                                │
│   • DNS / SSL / WAF / Turnstile (Anti-Bot)                                  │
│   • Cloudflare Workers: Roteamento de Borda e Rate Limiting                 │
└───────────────────────┬─────────────────────────────┬───────────────────────┘
                        │                             │
                        ▼                             ▼
        ┌───────────────────────────────┐     ┌──────────────────────────────┐
        │       MEDUSA.JS BACKEND       │     │       FLEETBASE ENGINE       │
        │   (Gestão do Lojista/Saipos)  │     │   (Orquestração de Frota)    │
        └───────────────┬───────────────┘     └───────────────┬──────────────┘
                        │                                     │
                        └──────────────────┬──────────────────┘
                                           │
                                           ▼
                        ┌─────────────────────────────────────┐
                        │          SUPABASE DATABASE          │
                        │   • PostgreSQL (Dados de Lojas)     │
                        │   • Row Level Security (RLS)        │
                        │   • Realtime (Eventos e Status)     │
                        └─────────────────────────────────────┘
```

---

## 2. Propósito e Responsabilidade de Cada Componente

### A. Supabase Database & Realtime
- **Responsabilidade Principal**: Única fonte de verdade (*Single Source of Truth*) dos dados relacionais do sistema.
- **Segurança (Row Level Security - RLS)**:
  - Todas as tabelas vinculadas ao lojista devem possuir políticas de RLS ativas.
  - Garante isolamento estrito (*multi-tenant*): o `merchant_id` autenticado só acessa dados de sua própria loja.
- **Realtime & Eventos**:
  - Escuta alterações de estado no banco e dispara Database Webhooks / Triggers em transições críticas (ex: de `processing` para `ready_for_pickup`).
  - Alimenta telas de KDS e despacho em tempo real com pub/sub de baixa latência.

### B. Cloudflare (Camada de Borda & Segurança)
- **Responsabilidade Principal**: Proteção perimetral de borda, terminação SSL, validação de requisições e ocultação dos IPs de origem dos servidores internos.
- **Headers & Tokens**:
  - A borda insere/valida os tokens JWT de autenticação antes que a requisição atinja o container do Medusa.
- **CORS & Rate Limiting**:
  - Apenas origens autorizadas pelo Cloudflare podem realizar chamadas nas rotas sensíveis do Medusa e da API do Fleetbase.
  - Mitigação de ataques de força bruta, scraping e DDoS.

### C. Medusa.js (Portal do Lojista & Commerce Engine)
- **Responsabilidade Principal**: Motor transacional central, substituindo o painel da Saipos.
- **Conexão com o Supabase**:
  - Conecta-se via PostgreSQL Connection String gerenciada pelo Supabase (porta `5432` direta ou `6543` pooler).
- **Workflows Customizados**:
  - Regras de negócio, catálogo de produtos, grupos de modificadores, mesas/comandas, cálculos de imposto local (BRL), precificação por canal de venda (Balcão, Delivery e iFood) e ciclo de vida do pedido.
- **Hub de Agregadores**:
  - Consumo ativo da fila do iFood via polling OAuth2 a cada 30 segundos, traduzindo pedidos externos para o pipeline unificado.

### D. Fleetbase Engine (Logística & Frota de Entregadores)
- **Responsabilidade Principal**: Orquestração logística, despacho inteligente, roteirização e aplicativo móvel dos entregadores.
- **Gatilho de Acionamento**:
  - Assim que o Medusa emite o evento `order.placed` ou `order.ready_for_pickup`, o backend aciona a API REST/Webhook do Fleetbase.
  - O Fleetbase cria a missão de transporte (*Delivery Mission*), despacha para a frota interna ou terceirizada e fornece link de rastreamento com telemetria GPS em tempo real.
