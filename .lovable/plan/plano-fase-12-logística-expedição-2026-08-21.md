# Plano: Fase 12 - Logística & Expedição

Implementação do módulo de Logística para gestão de fretes, transportadoras, romaneios de carga e rastreamento de entregas, integrando o fluxo de vendas ao despacho físico.

## Alterações

### Banco de Dados (Supabase)
- **Tabelas**:
  - `carriers`: Cadastro de transportadoras (nome, CNPJ, contato).
  - `shipping_methods`: Métodos de envio (Standard, Express, Retirada).
  - `shipments`: Registros de expedição vinculados a `sales` (código de rastreio, status: `pending`, `shipped`, `delivered`, `returned`).
  - `delivery_logs`: Histórico de eventos de entrega.

### Backend (Server Functions)
- **src/lib/logistics.functions.ts**:
  - `getCarriers`: Listagem de transportadoras.
  - `createShipment`: Gera uma nova expedição a partir de uma venda.
  - `updateShipmentStatus`: Atualiza status e registra logs de auditoria/rastreio.
  - `getShipmentStats`: Indicadores de logística (entregas no prazo, pendentes).

### UI / Componentes
- **src/components/logistics/create-shipment-dialog.tsx**: Modal para vincular venda a transportadora e gerar código de rastreio.
- **src/components/logistics/shipment-status-badge.tsx**: Componente visual para status de entrega.

### Rotas (Páginas)
- **src/routes/_authenticated/logistics/index.tsx**: Dashboard de logística com filtros por transportadora e status.
- **src/routes/_authenticated.tsx**: Adicionar "Logística" ao menu lateral.

## Detalhes Técnicos
- Integração RLS por `tenant_id`.
- Auditoria completa de mudanças de status.
- Validação de campos (Zod).

## Próximos Passos
- Fase 13: Gestão de Contratos & Assinaturas (Recorrência).
