# Plano de Implementação - Fase 4: Gestão de Estoque (UI e Fluxos)

Este plano foca na criação da interface de usuário para o módulo de estoque, permitindo que os usuários registrem movimentações e visualizem o histórico, consolidando a inteligência iniciada no backend.

## 1. Módulo de Estoque (UI)
- [ ] Criar a rota `src/routes/_authenticated/inventory/index.tsx` para listagem de movimentações.
- [ ] Implementar o componente `InventoryList` com filtros por produto, unidade e tipo de movimentação.
- [ ] Criar o modal `CreateInventoryTransactionDialog` para registrar novas entradas/saídas/ajustes.
- [ ] Adicionar navegação no menu lateral (`Sidebar`) para o novo módulo.

## 2. Refinamentos de Produto
- [ ] Atualizar o formulário de produtos (`CreateProductDialog` e `EditProductDialog`) para incluir os campos `min_stock` e `unit_of_measure`.
- [ ] Adicionar indicadores visuais de "Estoque Baixo" na listagem de produtos.

## 3. Inteligência de Dashboard
- [ ] Adicionar um link ou ação rápida no card de "Alertas de Estoque" para visualizar os produtos críticos.
- [ ] Garantir que o contador de alertas reflita as mudanças no estoque em tempo real.

## Detalhes Técnicos
- Utilização de `TanStack Query` para cache e revalidação de dados de inventário.
- Componentes baseados em `shadcn/ui` (Table, Dialog, Select, Badge).
- Validação rigorosa com `Zod` no frontend para garantir integridade dos dados enviados ao servidor.
- Garantia de isolamento por `tenant_id` em todas as operações de escrita.
