---
name: Plano de Implementação: Fase 11 - Recursos Humanos & Folha de Pagamento
description: Módulo completo para gestão de colaboradores, contratos, folha de pagamento e benefícios.
type: feature
---
# Plano de Implementação: Fase 11 - Recursos Humanos (RH)

Esta fase foca na gestão do capital humano, introduzindo o controle de colaboradores, cargos, salários e folha de pagamento.

## 1. Arquitetura de Banco de Dados
- **Tabela `employees`**: Dados pessoais e profissionais do colaborador (vinculado a `profiles` se for usuário do sistema).
- **Tabela `departments`**: Estrutura organizacional interna.
- **Tabela `job_positions`**: Catálogo de cargos e faixas salariais.
- **Tabela `payroll_records`**: Lançamentos mensais de folha de pagamento (integrado ao Financeiro).
- **Tabela `employee_documents`**: Armazenamento de contratos e documentos admissionais.
- **RLS**: Isolamento total por `tenant_id`.

## 2. Lógica de Backend (Server Functions)
- **`hireEmployee`**: Processo de admissão.
- **`generatePayroll`**: Cálculo automático de folha baseado em salário base e encargos.
- **`terminateEmployee`**: Gestão de desligamentos.
- **`getOrganizationChart`**: Visão hierárquica da empresa.

## 3. Interface do Usuário (UI)
- **Módulo de RH (`/hr`)**:
  - Dashboard com turnover e head count.
  - Listagem de Colaboradores com filtros por departamento.
  - Painel de Cargos e Salários.
  - Gestão de Folha de Pagamento.
- **Integração Financeira**: Lançamento automático das folhas pagas em `transactions`.

## Detalhes Técnicos
- Armazenamento de documentos via Supabase Storage.
- Auditoria específica para alterações salariais.
- Validação Zod para CPFs e dados sensíveis.
