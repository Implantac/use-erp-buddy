# Plano: Fase 13 - Relatórios & Exportação Avançada

Este módulo visa centralizar a geração de relatórios dinâmicos, permitindo que o usuário visualize e exporte dados cruciais de diversos módulos (Vendas, Financeiro, RH, Logística) em formatos variados (PDF, CSV).

## Alterações

### Banco de Dados
- **Tabela `report_templates`**: Armazenar modelos de relatórios customizados.
- **Tabela `report_exports`**: Log de exportações realizadas com link para download (Storage).

### Backend (Server Functions)
- **lib/reports.functions.ts**:
  - `generateReportData`: Função para consolidar dados de múltiplas tabelas baseado em filtros.
  - `exportToCsv`: Conversão de JSON para CSV.
  - `getReportTemplates`: Listagem de modelos pré-definidos.

### UI (Componentes & Rotas)
- **Rota `/_authenticated/reports/index.tsx`**: Dashboard de relatórios com cards por categoria.
- **Componente `ReportGenerator`**: Modal com filtros avançados (data, unidade, empresa) e botão de exportação.
- **Atualização Sidebar**: Adicionar item "Relatórios & BI" no menu lateral.

## Detalhes Técnicos
- Uso de `tanstack/react-query` para gerenciar o estado dos filtros e loading de geração.
- RLS garantindo que usuários só exportem dados de sua `company_id`/`unit_id`.
- Auditoria integrada: cada exportação gera um log na tabela `logs`.
