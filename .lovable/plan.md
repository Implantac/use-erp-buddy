# Plano: Fase 8 - Ecossistema & API Pública

A Fase 8 foca em transformar o Use Business OS em uma plataforma conectada, permitindo integrações externas, automações via webhooks e uma API pública documentada para desenvolvedores.

## Objetivos Técnicos

### 1. Infraestrutura de API Pública
- Criar rotas sob `src/routes/api/public/*` para exposição de endpoints.
- Implementar sistema de **API Keys** vinculado a tenants para autenticação de sistemas externos.
- Documentação básica via Swagger/OpenAPI (opcional/referência).

### 2. Webhook Engine
- Tabela `webhook_subscriptions` para armazenar URLs de destino e eventos (ex: `sale.created`, `inventory.low`).
- Worker/Queue logic (via server functions) para disparar notificações quando eventos ocorrem.

### 3. Integrações Nativas
- Conector base para serviços de pagamento (ex: Stripe/Stax) e logística.
- Webhook endpoints para receber confirmações externas.

## Ações Detalhadas

### Backend & Banco de Dados
- **Migração SQL**: 
  - Tabela `api_keys` (tenant_id, key_hash, label, permissions).
  - Tabela `webhook_subscriptions` (tenant_id, target_url, events[], active).
  - Tabela `webhook_logs` para auditoria de entregas.
- **Server Functions**:
  - `src/lib/api-keys.functions.ts`: CRUD de chaves de API.
  - `src/lib/webhooks.functions.ts`: Gestão de assinaturas e disparo de eventos.

### Interface do Usuário (UI)
- **Configurações > Desenvolvedor**:
  - Gestão de API Keys (gerar, revogar, copiar).
  - Configuração de Webhooks (adicionar endpoint, testar conexão).
- **Audit Log**: Filtro para ações realizadas via API.

## Segurança
- Validação rigorosa de tokens de API.
- Assinatura de payloads de Webhook (HMAC) para garantir origem.
- Rate limiting nos endpoints públicos.

## Próximos Passos
1. Executar migração de banco de dados.
2. Implementar endpoints básicos de API.
3. Criar a interface de gestão para o usuário administrador.
