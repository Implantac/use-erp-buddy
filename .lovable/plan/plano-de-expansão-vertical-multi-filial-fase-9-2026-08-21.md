# Plano de Expansão Vertical & Multi-filial (Fase 9)

Este plano detalha a implementação da Fase 9 do Use Business OS, focando em visão consolidada multi-empresa e operações avançadas entre unidades.

## 1. Banco de Dados & Infraestrutura
- Criar migração para adicionar `destination_unit_id` à tabela `inventory_transactions` para suportar transferências diretas.
- Adicionar suporte a filtros globais no Dashboard (Company/Unit/Group).

## 2. Backend (Server Functions)
- **`getDashboardStats`**: Atualizar para aceitar filtros de `company_id`, `unit_id` e `group_id`.
- **`inventory.functions.ts`**: Implementar lógica transacional para transferência de estoque entre unidades (baixa na origem e entrada no destino em uma única transação).
- **`getConsolidatedMetrics`**: Nova função para KPIs agregados de múltiplas filiais.

## 3. Frontend (UI/UX)
- **Dashboard Consolidado**:
  - Adicionar barra de filtros global no topo do dashboard.
  - Implementar visualização de performance comparativa entre unidades.
- **Módulo de Transferência**:
  - Refatorar o diálogo de movimentação de estoque para incluir o campo "Unidade de Destino" quando o tipo for "Transferência".
- **Relatórios Fiscais (Básico)**:
  - Criar rota `/reports` com exportação em CSV/PDF para fechamento de caixa e inventário.

## 4. Segurança & RLS
- Revisar políticas de RLS para garantir que a visão consolidada respeite as permissões do usuário em cada empresa/unidade.

---
Technical details:
- TanStack Start Server Functions will handle the heavy aggregation to minimize client-side processing.
- Recharts will be used for comparative branch performance charts.
- Supabase RPCs might be used for complex stock consolidations.
