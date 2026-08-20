# Plano de Implementação: Fase 3 - Refinamento e Verticais Iniciais

Este plano foca no refinamento das configurações do sistema e no início da modelagem operacional (Catálogo de Produtos e Financeiro Base).

## Etapas de Implementação

### 1. Refinamento de Configurações
- **Perfil do Usuário**: Upload de avatar e edição de dados pessoais.
- **Preferências do Tenant**: Configuração de branding (cores e logo) e timezone.
- **Segurança**: Log de acessos e troca de senha dentro do sistema.

### 2. Módulo de Catálogo de Produtos (Base Operacional)
- **Schema**: Tabela `products` e `categories` com RLS por tenant.
- **Funcionalidades**: CRUD de produtos, upload de fotos e categorias.
- **Integração**: Vincular produtos a empresas/unidades específicas, se necessário.

### 3. Módulo Financeiro Base
- **Schema**: Tabelas `transactions`, `accounts_payable` e `accounts_receivable`.
- **Funcionalidades**: Fluxo de caixa básico e controle de contas.
- **Dashboard**: Widgets financeiros (Saldo, Entradas, Saídas).

## Detalhes Técnicos

### Banco de Dados (Migrações)
- Criar `products` com `tenant_id` e políticas de RLS.
- Criar `transactions` com categorias financeiras e status.

### Componentes UI
- Utilizar `shadcn/ui` para formulários de produtos.
- Gráficos simples para o financeiro usando bibliotecas leves.

### Funções de Servidor
- `src/lib/products.functions.ts`
- `src/lib/finance.functions.ts`
