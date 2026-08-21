# Plano de Evolução: Fase 7 - BI, Dashboard Avançado e Convites de Equipe

Esta fase foca em transformar os dados operacionais em inteligência de negócio e completar os fluxos de colaboração.

## Objetivos
1. **Business Intelligence (BI)**: Evoluir o Financeiro com gráficos de tendências e filtros avançados.
2. **Dashboard 2.0**: Incluir métricas de vendas e gráficos de pizza para categorias de produtos e clientes.
3. **Gestão de Equipe**: Implementar o fluxo de convites (via UUID por enquanto, preparando para email) e edição de papéis.
4. **Relatórios**: Exportação básica de transações e vendas (CSV/PDF simulado).

## Detalhes Técnicos

### 1. Financeiro & BI
- **Componentes**: Adicionar `recharts` para visualização de dados.
- **Gráficos**: Fluxo de caixa mensal (Entradas vs Saídas).
- **Filtros**: Range de datas global para o módulo financeiro.

### 2. Dashboard Estratégico
- **Novos Cards**: Ticket médio de vendas, Clientes ativos, Crescimento mensal.
- **Gráficos**: Vendas por categoria (Pizza) e Volume de vendas semanal (Linha).

### 3. Colaboração (Equipe)
- **Invite Dialog**: Criar modal para adicionar membros via UUID do usuário (integrando com `auth.users`).
- **Role Update**: Permitir alteração de papéis (admin, manager, user, viewer) diretamente na listagem.

### 4. Auditoria & UX
- **Filtros de Auditoria**: Busca por usuário e tipo de ação (Insert/Update/Delete).
- **Toasts de Sistema**: Centralizar feedback de erro para falhas de rede/permissão.

## Arquivos Impactados
- `src/lib/finance.functions.ts` & `src/lib/sales.functions.ts`: Novas agregações.
- `src/routes/_authenticated/finance/index.tsx`: Gráficos e filtros.
- `src/routes/_authenticated/dashboard.tsx`: Widgets de BI.
- `src/lib/team.functions.ts`: Função `updateMemberRole` e `addMemberById`.
- `src/components/team/add-member-dialog.tsx`: Novo componente.

---
Este plano garante que o sistema "Use Business OS" passe de uma ferramenta de registro para uma ferramenta de decisão.