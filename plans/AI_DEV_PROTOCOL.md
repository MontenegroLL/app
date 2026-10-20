# 🤖 Protocolo de Desenvolvimento para Agentes de IA (Dev Protocol)

Este documento estabelece as **diretrizes inegociáveis de engenharia** para qualquer agente de IA que atue neste monorepo. O não cumprimento dessas regras compromete a integridade do código e a estabilidade da operação.

---

## 1. As Três Leis de Execução do Agente

### 🔹 Regra 1: Patch Cirúrgico
- **Proibido reescrever arquivos inteiros**: Nunca substitua arquivos complexos do Medusa, Fleetbase ou Next.js em sua totalidade apenas para alterar algumas linhas.
- **Edições localizadas**: Sempre forneça ou aplique alterações focadas em blocos específicos (`replace_file_content`, diffs cirúrgicos ou trechos isolados).
- **Preservação de Contexto**: Mantenha imports existentes, comentários funcionais, tipagens de borda e configurações já validadas.

### 🔹 Regra 2: Zero Exclusões
- **Proibido remover configurações sem autorização**: É terminantemente vedado apagar tabelas, colunas, variáveis de ambiente, regras de CORS, políticas de RLS do Supabase ou configurações do Cloudflare/Vite sem aprovação explícita.
- **Depreciação segura**: Se uma funcionalidade precisar ser descontinuada, marque-a como `@deprecated` ou isole-a antes de qualquer remoção de código.

### 🔹 Regra 3: Fluxo Lógico Primeiro
- **Explicação prévia do pipeline**: Antes de entregar ou executar qualquer código de workflow, API ou integração, o agente deve descrever o fluxo sequencial dos dados no seguinte padrão:
  $$\text{Origem do Evento} \longrightarrow \text{Processamento/Workflow} \longrightarrow \text{Persistência/Trigger} \longrightarrow \text{Efeito Colateral/API Externa}$$
  *Exemplo:*
  `Lojista clica em "Pronto" no Medusa` $\longrightarrow$ `Workflow emite order.ready_for_pickup` $\longrightarrow$ `Trigger aciona Webhook` $\longrightarrow$ `Chamada REST no Fleetbase cria Delivery Mission`.

---

## 2. Padrões de Código e Convenções do Projeto

1. **Localização e Moeda Obrigatórias**:
   - Todo preço é tratado em **BRL (Real Brasileiro)** com valor inteiro em centavos ou formato brasileiro (`R$ 15,00`).
   - Todos os países padrão são fixados no Brasil (`country_code: "br"`).
2. **Modelagem no Medusa v2**:
   - Modelos customizados devem usar a camada **DML (`model.define(...)`)** do Medusa Framework v2 em `src/modules/<modulo>/models`.
   - Workflows devem utilizar `createWorkflow` e `createStep` de `@medusajs/framework/workflows-sdk`.
3. **Manuseio de Variáveis de Ambiente**:
   - Qualquer nova variável deve ser adicionada simultaneamente no `.env` e no `.env.template` com valores de fallback seguros.
4. **Resiliência de Integrações**:
   - Chamadas HTTP a serviços externos (iFood, Fleetbase, Gateways de Pagamento) devem conter timeouts estritos e tratamento de erro sem derrubar o processo principal.
