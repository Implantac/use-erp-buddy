# Revisão do Plano - O que ainda falta implementar

Estado atual: Fases 1 a 16 estão no ar (auth/multi-tenant, empresas, unidades, grupos, equipe, produtos/categorias, estoque, compras/fornecedores, produção, RH+folha, logística, CRM+funil, vendas, financeiro, auditoria, automações, API pública/webhooks, relatórios). Abaixo o que continua pendente.

## 1. Pendências das fases já iniciadas

### Relatórios & Exportação (Fase 13) — incompleto
- `requestReportExport` apenas registra o pedido: não gera dados nem arquivo.
- Falta `generateReportData` (consolidação por filtros de data/empresa/unidade), conversão para CSV e geração de PDF.
- Falta upload do arquivo no Storage e link real de download na tela `/reports`.

### Recrutamento & Seleção (Fase 16) — incompleto
- Backend tem apenas listar vagas, criar vaga e listar candidatos.
- Falta: cadastrar/editar candidato, mover candidato entre etapas do processo, editar/encerrar vaga, vincular candidato aprovado a uma admissão em `employees`.
- Falta UI de pipeline de candidatos (hoje só existe o resumo de vagas).

### Segurança de banco — 4 avisos abertos
- 4 funções `SECURITY DEFINER` continuam executáveis por `anon`/`authenticated`.
- Corrigir com `REVOKE EXECUTE ... FROM anon, authenticated` nas funções internas, mantendo apenas as que precisam ser chamadas pelo app.

## 2. Módulos/recursos previstos e ainda não construídos

- **Dashboard Executivo (Fase 17)**: visão consolidada de margem, DRE simplificado, comparativos por período e por empresa.
- **Responsividade mobile**: revisão de todas as tabelas e do Kanban para telas pequenas.
- **Notificações**: central de alertas in-app (estoque crítico, contas a vencer, ordens atrasadas) e disparo por e-mail.
- **Contas a pagar/receber**: hoje o financeiro registra transações, falta controle de vencimento, baixa de pagamento e fluxo de caixa projetado.
- **Convites de usuários por e-mail**: gestão de equipe adiciona membros, mas falta convite com aceite.
- **Documentos e anexos**: upload de arquivos (contratos, NF, currículos) via Storage.
- **Onboarding do tenant**: assistente inicial para primeiro acesso (criar empresa/unidade/estoque inicial).

## Detalhes técnicos

- Exportações: nova função servidor em `src/lib/reports.functions.ts` + bucket privado no Storage com política por tenant.
- Recrutamento: expandir `src/lib/hr.functions.ts` e criar componentes de pipeline em `src/components/hr/`.
- Segurança: migração única com os `REVOKE` e revisão de `search_path` nas funções.
- Todas as novas tabelas seguem o padrão: `tenant_id`, GRANTs explícitos e RLS.

## Ordem sugerida

1. Corrigir os 4 avisos de segurança do banco.
2. Concluir a exportação real de relatórios (CSV + PDF + Storage).
3. Concluir o módulo de Recrutamento (candidatos e pipeline).
4. Contas a pagar/receber + central de notificações.
5. Dashboard Executivo e revisão mobile.
