# Plano: Edição e Desativação de Produtos

Implementar a funcionalidade de edição de produtos e a possibilidade de ativar/desativar itens diretamente no catálogo, mantendo a consistência visual, validações e feedback ao usuário.

## Alterações

### Backend (Server Functions)
- **lib/products.functions.ts**: Garantir que `updateProduct` esteja pronto para receber atualizações parciais (incluindo o campo `active`).

### Componentes UI
- **components/products/edit-product-dialog.tsx**: Novo componente baseado no `CreateProductDialog`, mas pré-preenchido com dados do produto selecionado para edição.
- **components/products/product-actions.tsx**: Novo componente para agrupar as ações de cada linha da tabela (Editar, Alternar Status).

### Frontend (Páginas)
- **routes/_authenticated/products/index.tsx**: 
  - Integrar as ações na tabela de produtos.
  - Adicionar coluna de "Ações".
  - Refinar a exibição do status (Badge).

## Detalhes Técnicos
- Utilizar `useMutation` para as atualizações para gerenciar estados de carregamento e erro.
- Invalidação automática do cache do TanStack Query (`["products"]`) após qualquer alteração.
- Validação com Zod no formulário de edição para garantir integridade dos dados.
- Feedback visual via `sonner` (toasts) para confirmação de ações.

## User Review Required
> [!IMPORTANT]
> A desativação de um produto impedirá que ele seja selecionado em novas transações financeiras, mas manterá o histórico existente.
