# Plano de Implementação: Módulos Operacionais

Focaremos agora na expansão dos módulos fundamentais do ERP (Grupos, Equipe e Configurações) e no refinamento das funcionalidades de Companies e Units.

## 1. Módulo de Grupos Organizacionais
- [ ] Criar `src/lib/groups.functions.ts` para CRUD de `organization_groups`.
- [ ] Criar rotas em `src/routes/_authenticated/groups/`.
- [ ] Implementar listagem e modal de criação de grupos.

## 2. Módulo de Equipe (Usuários e Papéis)
- [ ] Criar `src/lib/team.functions.ts` para gerenciar `user_roles` e convites.
- [ ] Implementar listagem de membros em `src/routes/_authenticated/team/`.
- [ ] Criar modal para convidar/adicionar membros com definição de `app_role`.

## 3. Módulo de Configurações
- [ ] Criar interface de perfil do usuário em `src/routes/_authenticated/settings/profile.tsx`.
- [ ] Criar interface de configurações do Tenant em `src/routes/_authenticated/settings/tenant.tsx`.

## 4. Refinamento de Fluxos
- [ ] Implementar edição de Empresas (`$companyId.tsx`).
- [ ] Implementar visualização detalhada de Unidades.
- [ ] Adicionar auditoria básica em cada ação de escrita via `audit_logs`.

## 5. Dashboard Evoluído
- [ ] Conectar os cards de estatísticas às contagens reais do banco via server functions.
