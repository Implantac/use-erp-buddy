# Plano: Fase 14 - CRM Avançado & Funil de Vendas

Este plano detalha a implementação do CRM Avançado, expandindo o módulo de clientes com gestão de oportunidades, funil de vendas (Kanban) e histórico de interações.

## Objetivos
- Implementar gestão de oportunidades de negócio.
- Criar visualização de Funil de Vendas (Kanban).
- Registrar interações com clientes (chamadas, e-mails, reuniões).
- Automação de tarefas de follow-up.

## Alterações

### 1. Database (Supabase)
- **Tabela `crm_opportunities`**:
  - `id`, `tenant_id`, `company_id`, `customer_id`, `title`, `description`, `value`, `stage` (lead, qualification, proposal, negotiation, closed_won, closed_lost), `probability`, `expected_closing_date`, `assigned_to` (profile_id), `status` (active, archived).
- **Tabela `crm_interactions`**:
  - `id`, `tenant_id`, `opportunity_id`, `customer_id`, `type` (call, email, meeting, note), `description`, `date`, `performed_by` (profile_id).
- **RLS**: Políticas baseadas em `tenant_id` e permissões de acesso.

### 2. Backend (Server Functions)
- **`src/lib/crm.functions.ts`**:
  - CRUD de oportunidades e interações.
  - Função para mover oportunidade entre estágios.
  - Dashboards de conversão e pipeline.

### 3. UI/UX
- **Rota `/_authenticated/crm/pipeline/index.tsx`**: Visualização em Kanban das oportunidades.
- **Rota `/_authenticated/crm/opportunities/[id].tsx`**: Detalhes da oportunidade e histórico de interações.
- **Componentes**: `opportunity-card.tsx`, `kanban-board.tsx`, `interaction-timeline.tsx`.

### 4. Integrações
- Integração com o módulo de Vendas: converter oportunidade "Closed Won" em uma Venda (`sale`) automaticamente.

## Próximos Passos
1. Executar migração de banco de dados.
2. Implementar funções de backend.
3. Desenvolver interface do Funil de Vendas.
