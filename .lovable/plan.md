# Plano de Implementação (Incremental - Passo 0)

Este plano foca em seguir as diretrizes do arquivo `incremental.txt` carregado pelo usuário, realizando a auditoria obrigatória e propondo as próximas ações para manter a evolução pragmática do sistema.

## 1. Auditoria do Estado Atual (PASSO 0)

### 1.1 Foundation (Base Técnica)
- **AUTH-001**: Sistema de autenticação funcional (100% - Login, Recuperação, Sessão).
- **TENANT-001**: Multi-tenancy funcional (100% - RLS ativo, isolamento verificado).
- **ORG-001**: Estrutura organizacional (100% - CRUD de Empresas e Unidades).
- **USER-001**: Gestão de usuários (100% - Perfis e permissões).

### 1.2 Core Operations (Fase 1)
- **PROD-001**: Produto Básico (100% - CRUD, SKU por tenant, Categorias).
- **PART-001**: Parceiros (Clientes/Fornecedores) (100% - CRUD, CPF/CNPJ único).
- **STOCK-001**: Estoque Simples (100% - Depósitos, Saldo, Movimentações Manuais).
- **PUR-001**: Compras Básico (100% - Pedidos, Recebimento, Entrada automática).
- **SALES-001**: Vendas Básico (100% - Orçamentos, Pedidos, Reserva de estoque).
- **FIN-001/002**: Financeiro Básico (100% - Contas a Pagar/Receber automáticas).

### 1.3 Módulos Avançados (Já Iniciados/Finalizados)
- **CRM Avançado**: Kanban e Oportunidades (100%).
- **RH & Folha**: Funções de backend existem, mas a rota `/hr` precisa de verificação de acessibilidade (90%).
- **Logística**: Gestão de fretes e transportadoras (100%).
- **Industrial**: BOM e Ordens de Produção (100%).
- **Automações**: Motor de regras proativo (100%).

## 2. Identificação de Débitos e Quebras
- **Interface de RH**: O arquivo existe em `src/routes/_authenticated/hr.tsx`, mas o usuário reportou que pode haver inconsistências ou falta de linkagem correta no sistema de rotas (HMR/router check).
- **Documentação de API**: A página de documentação pode estar defasada em relação aos novos módulos (Industrial/RH).

## 3. Próxima Ação (Objetivo Pragmático)
Seguindo o roadmap incremental:
1. **Refinamento V2 de Produtos**: Adicionar campos avançados (Marca, Dimensões, Peso) conforme `incremental.txt` (V2 do roadmap).
2. **Integração de Relatórios**: Unificar os templates de relatórios de todos os novos módulos.
3. **Estabilização da Rota /hr**: Garantir que a interface de RH esteja 100% funcional para o usuário.

## Detalhes Técnicos
- Atualizar a tabela `products` com novos campos.
- Validar as permissões de acesso da rota `/hr` via `check_access`.
