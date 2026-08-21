# Plano de Implementação - Fase 16: Consolidação & RH Estratégico

Este plano foca na conclusão dos refinamentos de produtos, expansão do módulo de RH com recrutamento e organização de relatórios por módulo conforme o roadmap incremental.

## Alterações Técnicas

### Backend & Database
- [x] Refinamento da tabela `products`: Adicionados campos `brand`, `weight`, `length`, `width`, `height`, `barcode`, `sku`.
- [ ] Segurança RLS: Revisar e aplicar `GRANT` e políticas em funções `SECURITY DEFINER` para evitar avisos do linter.
- [x] Migração de Dados: Inserir templates de relatórios padrão para novos módulos (RH, Industrial, Logística, CRM).

### Server Functions (`src/lib/`)
- [x] `products.functions.ts`: Atualizar validadores de `createProduct` e `updateProduct` para suportar os novos campos técnicos.
- [ ] `hr.functions.ts`: Implementar CRUD inicial para Recrutamento (Vagas e Candidatos).
- [ ] `reports.functions.ts`: Refinar lógica de exportação para garantir isolamento por tenant em todos os novos templates.

### Frontend & UI
- [x] `create-product-dialog.tsx` & `edit-product-dialog.tsx`: Formulários atualizados com campos de marca, dimensões e logística.
- [x] `_authenticated.tsx` (Sidebar): Adicionado atalho para "Recrutamento & Seleção" sob o grupo de RH.
- [x] `hr.tsx`: Adicionada aba de "Recrutamento" com dashboard operacional de vagas.
- [x] `reports/index.tsx`: Interface de relatórios agora exibe categorias para todos os módulos do sistema.

## Próximos Passos
1. Finalizar a lógica de recrutamento no backend.
2. Resolver os avisos de segurança do Supabase Linter (search_path, grants).
3. Iniciar a Fase 17: Dashboard Executivo & Mobile First.

**Atenção:** As alterações visuais no rodapé da página inicial foram removidas conforme solicitado, mantendo o registro de progresso apenas em comentários técnicos de cabeçalho.
