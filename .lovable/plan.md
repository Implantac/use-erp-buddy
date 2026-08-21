# Plano de Refinamento: Gestão de Categorias e Vendas

Este plano foca em aprimorar a experiência do usuário e a robustez do sistema nos módulos de Produtos e Vendas, garantindo validações consistentes e feedback visual.

## Ações Técnicas

### 1. Refinamento de Produtos e Categorias
- **Diálogo de Edição de Categorias**: Ajustar o `CategoriesManager` para garantir que o feedback de "ativo/inativo" seja instantâneo e reflita corretamente no catálogo de produtos.
- **Validação de Categoria Ativa**: Reforçar a lógica no `CreateProductDialog` e `EditProductDialog` para filtrar apenas categorias com `active: true`.
- **Badge de Status de Categoria**: Padronizar as cores dos badges de status no `CategoriesManager` para alinhar com o design system (Verde para Ativo, Cinza para Inativo).

### 2. Fluxo de Vendas e Estoque
- **Validação de Saldo em Vendas**: Implementar verificação de saldo de estoque no frontend (CreateSaleDialog) e backend (sales.functions.ts) para evitar vendas de produtos sem estoque suficiente.
- **Busca Avançada de Produtos na Venda**: Melhorar o seletor de produtos no `CreateSaleDialog` para exibir o saldo atual e o preço unitário de forma clara.
- **Histórico de Vendas**: Adicionar detalhamento de itens vendidos na listagem de vendas (`SalesPage`).

### 3. Melhorias de UI/UX
- **Toasts de Feedback**: Padronizar as mensagens de sucesso/erro em todas as operações de CRUD restantes.
- **Loading States**: Garantir que todos os botões de ação (Salvar, Editar, Deletar) exibam um spinner durante o processamento assíncrono.

## Detalhes Técnicos
- Uso de `useMutation` para garantir invalidação de cache do `react-query` após alterações.
- Reforço de RLS nas políticas de `sales` e `sale_items` para isolamento total.
- Atualização das Server Functions para retornar metadados úteis para o frontend (como `stock_quantity` atualizado).
