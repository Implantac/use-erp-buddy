import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/public/openapi')({
  server: {
    handlers: {
      GET: async () => {
        const spec = {
          openapi: '3.0.0',
          info: {
            title: 'Use Business OS Public API',
            version: '1.0.0',
            description: 'API pública para integração com o ecossistema Use Business OS.',
          },
          servers: [
            {
              url: '/api/public',
              description: 'Servidor Principal',
            },
          ],
          components: {
            securitySchemes: {
              ApiKeyAuth: {
                type: 'apiKey',
                in: 'header',
                name: 'x-api-key',
              },
            },
            schemas: {
              Product: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  sku: { type: 'string' },
                  price: { type: 'number' },
                  stock: { type: 'integer' },
                  min_stock: { type: 'integer' },
                  unit_of_measure: { type: 'string' },
                  active: { type: 'boolean' },
                  tenant_id: { type: 'string', format: 'uuid' },
                  created_at: { type: 'string', format: 'date-time' },
                },
              },
              Error: {
                type: 'object',
                properties: {
                  error: { type: 'string' },
                },
              },
            },
          },
          security: [
            {
              ApiKeyAuth: [],
            },
          ],
          paths: {
            '/products': {
              get: {
                summary: 'Listar produtos',
                description: 'Retorna a lista completa de produtos cadastrados para o tenant associado à chave de API.',
                responses: {
                  '200': {
                    description: 'Sucesso',
                    content: {
                      'application/json': {
                        schema: {
                          type: 'array',
                          items: {
                            $ref: '#/components/schemas/Product',
                          },
                        },
                      },
                    },
                  },
                  '401': {
                    description: 'Chave de API ausente',
                    content: {
                      'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                      },
                    },
                  },
                  '403': {
                    description: 'Chave de API inválida ou inativa',
                    content: {
                      'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                      },
                    },
                  },
                },
              },
            },
          },
        };

        return new Response(JSON.stringify(spec), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      },
    },
  },
});
