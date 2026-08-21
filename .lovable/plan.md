# Plano de Implementação: Fase 6 - Auditoria e Automações

Este plano foca na implementação da infraestrutura de auditoria, refinamento dos módulos comerciais (CRM/Vendas) e preparação para automações.

## 1. Banco de Dados e Auditoria
- Criar a tabela `audit_logs` para rastrear mudanças em todas as entidades (Empresas, Unidades, Produtos, Vendas, etc).
- Implementar uma função de banco para facilitar a inserção de logs de auditoria.
- Adicionar RLS e permissões para a tabela de auditoria.

## 2. Refinamento Comercial (Fase 5 - Finalização)
- **CRM**: Criar o componente `CreateCustomerDialog` e `EditCustomerDialog` para completar o CRUD de clientes.
- **Vendas**: Criar o componente `CreateSaleDialog` para permitir o registro de novas vendas integradas ao estoque e financeiro.
- Adicionar filtros e busca avançada na listagem de vendas.

## 3. Módulo de Auditoria (UI)
- Criar uma nova rota `src/routes/_authenticated/audit/index.tsx` para visualização dos logs do sistema.
- Adicionar link no menu lateral sob o grupo "Configurações" ou "Administração".

## 4. Automações Iniciais
- Implementar notificações automáticas no Dashboard para baixas de estoque e transações financeiras pendentes.
- Criar um helper no backend para gerar alertas automáticos.

## Detalhes Técnicos
- A tabela `audit_logs` conterá: `id`, `tenant_id`, `user_id`, `action` (INSERT, UPDATE, DELETE), `entity_name`, `entity_id`, `old_data` (jsonb), `new_data` (jsonb), `created_at`.
- As funções de CRM e Vendas serão finalizadas para garantir que o fluxo comercial esteja 100% funcional antes de seguir.
