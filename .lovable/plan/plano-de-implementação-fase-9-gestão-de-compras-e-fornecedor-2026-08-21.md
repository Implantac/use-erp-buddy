# Plano de Implementação: Fase 9 - Gestão de Compras e Fornecedores

Esta fase foca na vertical de suprimentos, permitindo que o tenant gerencie seus fornecedores, ordens de compra e a entrada de mercadorias no estoque de forma integrada ao financeiro.

## 1. Banco de Dados (Database)
- Criar tabela `suppliers` (tenant_id, name, tax_id/CNPJ, email, phone, address).
- Criar tabela `purchase_orders` (tenant_id, supplier_id, status: pending/received/cancelled, total_amount).
- Criar tabela `purchase_items` (purchase_order_id, product_id, quantity, unit_price).
- Habilitar RLS e definir Grants para todas as novas tabelas.

## 2. Backend (Server Functions)
- `suppliers.functions.ts`: CRUD de fornecedores.
- `purchases.functions.ts`:
  - `createPurchaseOrder`: Registra a intenção de compra.
  - `receivePurchaseOrder`: Processa a entrada de estoque (aumenta `stock_quantity`) e cria automaticamente uma transação de `expense` (despesa) no financeiro.
  - `getPurchaseHistory`: Listagem com filtros.

## 3. Interface (UI/UX)
- **Módulo de Fornecedores**: Nova aba ou sub-rota em `/crm` ou rota dedicada `/purchases/suppliers`.
- **Módulo de Compras** (`/purchases`):
  - Listagem de Ordens de Compra.
  - Dialog para Nova Compra (seleção de fornecedor e itens).
  - Ação de "Confirmar Recebimento" com feedback visual.

## Detalhes Técnicos
- Utilizar `zod` para validação de CNPJ e dados de fornecedores.
- Garantir que o `tenant_id` seja injetado corretamente via middleware de autenticação.
- Integrar com `logAudit` para rastrear entradas de estoque volumosas.
- As transações financeiras geradas devem ser marcadas com a categoria "Compras/Suprimentos".
