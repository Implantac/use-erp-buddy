# Plan - Use ERP (Phase 2 & 3)

Continuando a construção do "USE BUSINESS OS". Agora que a fundação e a autenticação básica estão prontas, vamos focar na gestão organizacional e na interface administrativa real.

## Phase 2: Identity & Access (Refinamento)
- [ ] Implementar middleware de proteção de rota real (verificar sessão no `loader`).
- [ ] Criar fluxo de seleção de Tenant/Empresa após o login (caso o usuário tenha mais de uma).
- [ ] Implementar recuperação de senha e verificação de e-mail.

## Phase 3: Gestão Organizacional (Módulos)
- [ ] **Módulo de Empresas**: CRUD completo para `companies` vinculado ao Tenant.
- [ ] **Módulo de Unidades/Locais**: Gestão de filiais, armazéns e pontos de operação.
- [ ] **Perfil do Usuário**: Edição de dados pessoais e troca de senha.
- [ ] **Gestão de Equipe**: Convite de novos usuários e atribuição de `app_role`.

## Phase 4: Infraestrutura Operacional (Próximos Passos)
- [ ] Definição do esquema de Produtos e Serviços.
- [ ] Definição do esquema de Clientes e Fornecedores (CRM Base).
- [ ] Sistema de logs de auditoria visível para admins.

## Technical Details
- **Auth**: Integração profunda com Supabase Auth + TanStack Router Loaders.
- **State**: Uso de TanStack Query para cache de dados organizacionais.
- **UI**: Componentes Shadcn UI personalizados para formulários complexos.
