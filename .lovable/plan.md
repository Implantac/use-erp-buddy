# Plano de Implementação: Fase 10 - Expansão Industrial & Produção

A Fase 10 foca em transformar o "Use ERP" em um sistema capaz de gerir processos produtivos complexos, introduzindo o conceito de Ordens de Produção, Fórmulas (BOM - Bill of Materials) e custos de fabricação.

## 1. Arquitetura de Banco de Dados
- **Tabela `product_formulas`**: Define a composição de um produto final (insumos e quantidades).
- **Tabela `production_orders`**: Rastreia o ciclo de vida da fabricação (`rascunho`, `em_producao`, `concluido`, `cancelado`).
- **Tabela `production_items`**: Registra os insumos consumidos em uma ordem específica.
- **RLS**: Isolamento por `tenant_id` em todas as novas tabelas.

## 2. Lógica de Backend (Server Functions)
- **`createProductionOrder`**: Inicia o processo, reservando insumos no estoque (opcional) ou apenas registrando a intenção.
- **`finishProductionOrder`**: Ação crítica que realiza a baixa automática dos insumos e a entrada automática do produto acabado no estoque da unidade selecionada.
- **`calculateProductionCost`**: Função para estimar o custo do produto final baseado no preço médio dos insumos.

## 3. Interface do Usuário (UI)
- **Módulo de Produção (`/production`)**:
  - Dashboard de ordens ativas.
  - Editor de Fórmulas (BOM) integrado ao catálogo de produtos.
  - Wizard de criação de Ordem de Produção com verificação de disponibilidade de estoque.
- **Integração com Estoque**: Visualização de "Insumos" vs "Produtos Acabados".

## Detalhes Técnicos
- Uso de `supabase.rpc` para transações atômicas de baixa/entrada de estoque.
- Logs de auditoria específicos para o tipo `production`.
- Validação Zod para garantir que a quantidade produzida seja positiva e que insumos existam.

---
Este módulo consolida o Use ERP como uma solução completa para indústrias e manufaturas.
