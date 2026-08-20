# Plano de Implementação: Paginação na Listagem de Unidades

O objetivo é adicionar um sistema de paginação na tela de listagem de unidades, permitindo ao usuário navegar por grandes volumes de dados de forma eficiente.

## Alterações Técnicas

### 1. Backend (Server Functions)
- Modificar `src/lib/units.functions.ts` para suportar parâmetros de paginação (`page`, `pageSize`).
- Atualizar a função `getMyUnits` para retornar o total de registros (count) além dos dados da página atual.

### 2. Frontend (UI/UX)
- Atualizar `src/routes/_authenticated/units/index.tsx` para gerenciar o estado da página atual.
- Integrar o componente `Pagination` do Shadcn UI.
- Garantir que a busca e os filtros resetem para a primeira página ao serem alterados.
- Exibir indicadores de carregamento e estado vazio apropriados.

## Detalhes de Implementação

- **Paginação no Servidor:** Utilizaremos o `.range()` do Supabase para buscar apenas os registros necessários.
- **Componentes:** Uso de `Pagination`, `PaginationContent`, `PaginationItem`, etc., já presentes no projeto.
- **Estado:** Utilizaremos `useState` para `currentPage` e `pageSize` (padrão 10).
