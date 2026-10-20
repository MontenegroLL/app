# 🧭 Hub de Planejamento & Diretrizes para Agentes de IA

Este diretório centraliza a arquitetura, o protocolo operacional de desenvolvimento e o rastreador de sprints para que qualquer agente de Inteligência Artificial (Antigravity, Cursor, Ollama/Qwen, VS Code Copilot, etc.) atue de forma padronizada, consistente e com **zero quebras de estrutura**.

---

## 📂 Estrutura do Diretório

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Mapeamento da infraestrutura técnica e papéis de cada componente (**Cloudflare**, **Medusa.js**, **Fleetbase** e **Supabase**).
- **[AI_DEV_PROTOCOL.md](./AI_DEV_PROTOCOL.md)**: Regras obrigatórias de execução para agentes de IA (**Patch Cirúrgico**, **Zero Exclusões**, **Fluxo Lógico Primeiro**).
- **[SPRINT_TRACKER.md](./SPRINT_TRACKER.md)**: Rastreamento executivo de Sprints (Fases 1 a 5), marcando as etapas concluídas, em andamento e pendentes.
- **`sprints/`**: Detalhamento técnico de cada sprint individual.
  - **[sprints/SPRINT_01_CORE_MODELING.md](./sprints/SPRINT_01_CORE_MODELING.md)**: Sprint 1 (Modelagem Core de Modificadores, Mesas/Comandas e Hub iFood).

---

## ⚡ Regra de Ouro para Agentes

> **Antes de qualquer alteração no código:**
> 1. Leia o [AI_DEV_PROTOCOL.md](./AI_DEV_PROTOCOL.md).
> 2. Verifique o status da sprint ativa em [SPRINT_TRACKER.md](./SPRINT_TRACKER.md).
> 3. Explique o **fluxo lógico dos dados** antes de propor código.
> 4. Aplique apenas **patches cirúrgicos** em diff ou blocos isolados.
