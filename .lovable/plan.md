# Plano de Implementação - Fase 5: CRM e Gestão de Vendas

Este plano detalha a implementação do módulo de CRM e Vendas, permitindo a gestão de clientes e o registro de pedidos/vendas integrados ao estoque e financeiro.

## 1. Banco de Dados (Supabase)
*   **Tabela `customers`**: Dados de clientes (nome, documento, contato, endereço).
*   **Tabela `sales`**: Registro de pedidos de venda (cliente, status, total, data).
*   **Tabela `sale_items`**: Itens de cada venda (produto, quantidade, preço unitário, desconto).
*   **Políticas RLS**: Isolamento por `tenant_id` em todas as novas tabelas.

## 2. Backend (TanStack Start Server Functions)
*   `src/lib/crm.functions.ts`: CRUD de clientes.
*   `src/lib/sales.functions.ts`: 
    *   Criação de vendas com transação atômica.
    *   Integração automática: baixar estoque via `inventory_transactions` e gerar entrada financeira em `transactions`.
    *   Listagem e relatórios de vendas.

## 3. Interface (Frontend)
*   **Módulo CRM**:
    *   `src/routes/_authenticated/crm/index.tsx`: Listagem de clientes com busca e filtros.
    *   `src/components/crm/customer-dialogs.tsx`: Modais de criação e edição.
*   **Módulo de Vendas**:
    *   `src/routes/_authenticated/sales/index.tsx`: Histórico de vendas.
    *   `src/routes/_authenticated/sales/new.tsx`: Interface de PDV/Novo Pedido (seleção de cliente, busca de produtos, carrinho).
*   **Navegação**: Adicionar "Vendas" e "Clientes" ao grupo "Comercial" na Sidebar.

## Detalhes Técnicos
*   Utilização de `createServerFn` com `requireSupabaseAuth`.
*   Validação rigorosa com Zod.
*   Garantia de que vendas só podem ser feitas para produtos com estoque suficiente (ou aviso de estoque negativo se configurado).
