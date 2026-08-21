# Plano de Implementação - Fase 15: Automação & Inteligência Operacional

Esta fase foca em transformar o "Use Business OS" em um sistema proativo, utilizando automações de fluxo de trabalho e gatilhos inteligentes.

## 1. Alterações no Banco de Dados (Supabase)

### Novas Tabelas
- `automation_rules`: Regras configuráveis pelo usuário (ex: "Se estoque < min, criar ordem de compra").
- `system_notifications`: Alertas internos baseados em eventos do sistema.
- `workflow_triggers`: Registro de execuções de automação.

### Segurança (RLS)
- Políticas de isolamento por `tenant_id` em todas as novas tabelas.
- Grants para `authenticated` e `service_role`.

## 2. Backend (Server Functions)

### `src/lib/automations.functions.ts`
- `evaluateRules(entity, action, data)`: Motor de regras acionado após operações de escrita.
- `createNotification(userId, title, message, type)`: Utilitário para alertas.

## 3. Interface (UI)

### Módulo de Automação
- `src/routes/_authenticated/settings/automations.tsx`: Interface para criar e gerenciar regras.
- Central de Notificações na Sidebar ou Header.

## 4. Integrações
- Gatilhos de Email/Webhook automáticos para eventos críticos (ex: Aprovação de Compra, Venda Grande).

## Detalhes Técnicos (Desenvolvedor)
- Implementação de um "Event Bus" simples dentro das Server Functions existentes para disparar `evaluateRules`.
- Uso de Enums para tipos de gatilhos (INSERT, UPDATE, DELETE) e ações (EMAIL, NOTIFY, CREATE_TASK).
