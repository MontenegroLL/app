# 🎯 Sprint 1: Modelagem Core (Modificadores, Mesas & Comandas)

## 🎯 Objetivo
Transformar o Medusa v2 em um motor nativo para restaurantes, implementando as entidades de dados essenciais para itens customizáveis (Adicionais/Modificadores) e controle de salão (Mesas/Comandas).

---

## 🛠️ Especificação dos Modelos (Medusa DML)

### 1. `ModifierGroup` (`src/modules/restaurant/models/modifier-group.ts`)
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `id` | Identificador único (`modgrp_...`) |
| `name` | `text` | Nome visível (ex: "Ponto da Carne", "Adicionais") |
| `description` | `text` (opcional) | Instrução para o cliente (ex: "Escolha até 2 opções") |
| `min_selection` | `number` | Mínimo de opções obrigatórias (`0` = opcional, `1` = obrigatório) |
| `max_selection` | `number` | Máximo permitido de seleção neste grupo |
| `product_id` | `text` | Identificador do produto vinculado no Medusa |
| `modifiers` | `hasMany(Modifier)` | Lista de modificadores deste grupo |

---

### 2. `Modifier` (`src/modules/restaurant/models/modifier.ts`)
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `id` | Identificador único (`mod_...`) |
| `name` | `text` | Nome do adicional (ex: "Bacon Crocante", "Queijo Cheddar") |
| `price` | `bigNumber` | Valor em centavos de BRL a ser adicionado (ex: `450` para R$ 4,50) |
| `is_default` | `boolean` | Se o item já vem marcado por padrão |
| `max_quantity` | `number` | Limite de repetição do mesmo item (ex: até 3x bacon) |
| `group_id` | `text` | Chave estrangeira para o `ModifierGroup` |

---

### 3. `RestaurantTable` (`src/modules/restaurant/models/restaurant-table.ts`)
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `id` | Identificador único (`tbl_...`) |
| `name_or_number` | `text` | Identificação da mesa (ex: "Mesa 01", "Varanda 04") |
| `capacity` | `number` | Capacidade de assentos |
| `status` | `enum` | `available`, `occupied`, `reserved`, `billing` |
| `qr_code_token` | `text` | Token seguro para cardápio digital na mesa |

---

### 4. `Tab` (`src/modules/restaurant/models/tab.ts`)
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `id` | Identificador único (`tab_...`) |
| `table_id` | `text` (opcional) | Mesa associada |
| `customer_name` | `text` | Nome ou identificação da comanda |
| `status` | `enum` | `open`, `closed`, `cancelled` |

---

## 📋 Checklist de Entrega da Sprint 1

- [ ] Criar estrutura do módulo em `apps/backend/src/modules/restaurant`
- [ ] Definir os 4 modelos DML (`ModifierGroup`, `Modifier`, `RestaurantTable`, `Tab`)
- [ ] Criar `service.ts` e `index.ts` do módulo `restaurant`
- [ ] Registrar módulo no `apps/backend/medusa-config.ts`
- [ ] Executar migrations no banco Supabase
- [ ] Testar persistência de modificadores e mesas via script CLI
