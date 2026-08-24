---
title: Integração de Widgets de Recrutamento e Produção no Dashboard
description: Implementar widgets específicos para RH (vagas/candidatos) e Produção (ordens planejadas/em andamento) na home principal.
---

# Plano de Implementação: Dashboard Operacional Consolidado

O objetivo é integrar os novos módulos (RH e Produção) no Dashboard principal (`src/routes/_authenticated/dashboard.tsx`), fornecendo uma visão 360º da operação.

## 1. Backend (Server Functions)
- **src/lib/dashboard.functions.ts**:
    - Expandir `getDashboardStats` para incluir:
        - `hr`: total de vagas abertas e candidatos recentes.
        - `production`: ordens planejadas e ordens em produção.
    - Adicionar os `Select` necessários nas queries para buscar essas informações respeitando o isolamento por tenant/empresa/unidade.

## 2. Frontend (Componentes de Dashboard)
- **src/components/dashboard/production-widget.tsx**: Novo componente para listar ordens de produção críticas.
- **src/components/dashboard/recruitment-widget.tsx**: Novo componente para listar vagas ativas e novos candidatos.

## 3. Integração na Rota de Dashboard
- **src/routes/_authenticated/dashboard.tsx**:
    - Atualizar a interface para incluir as novas seções.
    - Organizar o layout em um grid responsivo que acomode as notificações, RH e Produção.

## 4. Detalhes Técnicos
- Utilizar `useSuspenseQuery` para manter a consistência de carregamento.
- Adicionar filtros de empresa/unidade para que os widgets reflitam o contexto selecionado.
- Manter o padrão visual `shadcn/ui` (Cards, Badges, Tables compactas).

---
## Passo a Passo

### Passo 1: Atualizar `getDashboardStats`
- Adicionar contagem de `job_vacancies` (status 'open') e `job_candidates`.
- Adicionar contagem de `production_orders` por status.

### Passo 2: Criar Componentes de Widget
- Criar `ProductionWidget` com gráfico simples ou lista de ordens em progresso.
- Criar `RecruitmentWidget` com resumo de vagas.

### Passo 3: Atualizar Layout do Dashboard
- Inserir os novos widgets no grid principal.
