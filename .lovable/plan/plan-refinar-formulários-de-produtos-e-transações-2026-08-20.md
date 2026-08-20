# Plan: Refinar formulários de Produtos e Transações

Este plano visa aprimorar a experiência do usuário nos módulos de Produtos e Financeiro, adicionando diálogos de criação robustos com validação de dados, feedback de erros e estados de carregamento.

## Mudanças

### Backend (Server Functions)
- Pequeno ajuste em `src/lib/products.functions.ts` e `src/lib/finance.functions.ts` para garantir que as mensagens de erro do Supabase sejam repassadas adequadamente.
- Adição de `getCompanies` em `src/lib/companies.functions.ts` (caso não exista) para popular seletores nos formulários.

### Frontend (Componentes de UI)
- **Produtos**:
  - Criar `src/components/products/create-product-dialog.tsx`: Modal com formulário validado por Zod (React Hook Form).
  - Incluir campos: Nome, SKU, Preço, Categoria, Estoque, Descrição.
  - Adicionar estados de `loading` no botão de salvar e mensagens de erro específicas por campo.
- **Financeiro**:
  - Criar `src/components/finance/create-transaction-dialog.tsx`: Modal para novas transações.
  - Incluir campos: Descrição, Valor, Data, Tipo (Receita/Despesa), Categoria, Empresa relacionada.
  - Validação rigorosa do campo de valor (moeda) e data.
- **Integração**:
  - Atualizar `src/routes/_authenticated/products/index.tsx` e `src/routes/_authenticated/finance/index.tsx` para abrir estes novos modais nos botões correspondentes.

## Detalhes Técnicos
- **Validação**: Uso de `zod` e `react-hook-form`.
- **Feedback**: `sonner` para notificações de sucesso/erro.
- **Segurança**: RLS garante que `tenant_id` seja respeitado; o formulário buscará o `tenant_id` do contexto do usuário logado.

## User Review Required
- Nenhuma decisão crítica pendente. Os formulários seguirão o padrão Shadcn UI já estabelecido.
