# 🤖 Universal Guidelines for AI Coding Agents

Bem-vindo a este projeto. Antes de realizar qualquer leitura aprofundada ou alteração no código, você DEVE seguir as instruções abaixo:

## 1. Documentos Obrigatórios de Consulta
1. **[plans/MULTI_AGENT_WORKPLACE.md](./plans/MULTI_AGENT_WORKPLACE.md)**: Canal de diálogo, tabela de bloqueio de arquivos (*File Locks*) e livro de histórico/handoff.
2. **[plans/AI_DEV_PROTOCOL.md](./plans/AI_DEV_PROTOCOL.md)**: As 3 Leis de Engenharia (*Patch Cirúrgico*, *Zero Exclusões*, *Fluxo Lógico Primeiro*).
3. **[plans/ARCHITECTURE.md](./plans/ARCHITECTURE.md)**: Arquitetura completa (Cloudflare + Medusa + Fleetbase + Supabase).
4. **[plans/SPRINT_TRACKER.md](./plans/SPRINT_TRACKER.md)**: Quadro da Sprint ativa e tarefas pendentes.

## 2. Ferramentas Integradas (Superpowers)
Este repositório possui as habilidades do **Superpowers** instaladas em [`.agents/skills/`](./.agents/skills/).
Consulte as habilidades antes de executar planos:
- `subagent-driven-development` (para orquestração de tarefas paralelas e subagentes)
- `test-driven-development` (para implementação orientada a testes)
- `verification-before-completion` (para validação estrita antes de finalizar a sessão)
- `using-git-worktrees` (para trabalho isolado e sem conflito de branch)

## 3. Protocolo de Check-in e Check-out
- Ao iniciar: Leia a última entrada do Handoff Ledger em `plans/MULTI_AGENT_WORKPLACE.md`.
- Durante a execução: Registre sua trava (*File Lock*) se for criar ou alterar módulos inteiros.
- Ao concluir: Adicione seu resumo de sessão no Handoff Ledger com o status do build e instruções para o próximo agente.
