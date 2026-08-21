# Plano: Gestão de Categorias (Edição e Status)

Implementar a funcionalidade de edição e gerenciamento de status para categorias de produtos, permitindo renomear e ativar/desativar itens com validação e feedback visual.

## Alterações

### Backend (Server Functions)
- **lib/products.functions.ts**:
  - Adicionar `updateCategory` para permitir alteração de nome e status (`active`).
  - Adicionar `createCategory` (caso não exista ou precise de refinamento).

### Componentes UI
- **components/products/categories-manager.tsx**: Novo componente para gerenciar a listagem de categorias em um modal ou seção dedicada.
- **components/products/edit-category-dialog.tsx**: Diálogo para edição de uma categoria específica.

### Frontend (Páginas)
- **routes/_authenticated/products/categories.tsx**: Nova rota para gestão exclusiva de categorias (opcional) ou integração na página de produtos. Vamos adicionar uma aba ou seção na página de Produtos para gerenciar categorias.

## Detalhes Técnicos
- Validação com Zod para garantir nomes únicos (no nível do banco) e não vazios.
- Invalidação de queries `["categories"]` e `["products"]` após alterações.
- Feedback visual com `sonner`.
- Garantir isolamento por `tenant_id`.

## User Review Required
> [!IMPORTANT]
> Desativar uma categoria não removerá os produtos associados, mas pode impedir que novos produtos sejam criados nela.
