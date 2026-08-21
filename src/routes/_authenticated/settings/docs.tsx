import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Copy, ExternalLink, Key, Code, Webhook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings/docs")({
  component: ApiDocsPage,
});

function ApiDocsPage() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const productsExample = `[
  {
    "id": "uuid-1",
    "name": "Produto Exemplo",
    "sku": "PROD-001",
    "price": 99.90,
    "stock": 15,
    "min_stock": 5,
    "unit_of_measure": "UN",
    "active": true
  }
]`;

  const webhookExample = `{
  "event": "sale.created",
  "payload": {
    "id": "sale-uuid",
    "total": 150.00,
    "customer": "Nome do Cliente",
    "items": [...]
  },
  "timestamp": "${new Date().toISOString()}"
}`;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentação da API</h1>
        <p className="text-muted-foreground">
          Integre seus sistemas externos com o Use Business OS através de nossa API REST e Webhooks.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[250px_1fr]">
        <aside className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Fundamentos</h4>
            <Button variant="ghost" className="w-full justify-start font-normal" asChild>
              <a href="#autenticacao">Autenticação</a>
            </Button>
            <Button variant="ghost" className="w-full justify-start font-normal" asChild>
              <a href="#base-url">URL Base</a>
            </Button>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Endpoints</h4>
            <Button variant="ghost" className="w-full justify-start font-normal" asChild>
              <a href="#products">Produtos (GET)</a>
            </Button>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Notificações</h4>
            <Button variant="ghost" className="w-full justify-start font-normal" asChild>
              <a href="#webhooks">Webhooks</a>
            </Button>
          </div>
        </aside>

        <main className="space-y-12">
          {/* Autenticação */}
          <section id="autenticacao" className="scroll-mt-20 space-y-4">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Autenticação</h2>
            </div>
            <p>
              Todas as requisições devem incluir o cabeçalho <code>x-api-key</code> com sua chave gerada no painel de desenvolvedor.
            </p>
            <Card className="bg-muted/50 border-none">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-2 p-3 bg-zinc-950 text-zinc-50 rounded-md font-mono text-sm">
                  <span>x-api-key: sua_chave_aqui</span>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard("x-api-key: sua_chave_aqui")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* URL Base */}
          <section id="base-url" className="scroll-mt-20 space-y-4">
            <h2 className="text-2xl font-bold">URL Base</h2>
            <p>A URL base para todas as chamadas da API pública é:</p>
            <div className="p-3 bg-muted rounded-md font-mono text-sm">
              {window.location.origin}/api/public
            </div>
          </section>

          {/* Products Endpoint */}
          <section id="products" className="scroll-mt-20 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Listar Produtos</h2>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase">GET</Badge>
            </div>
            
            <p className="text-muted-foreground italic">/products</p>
            <p>Retorna a lista completa de produtos cadastrados no seu tenant.</p>

            <Tabs defaultValue="request">
              <TabsList>
                <TabsTrigger value="request">Request</TabsTrigger>
                <TabsTrigger value="response">Response</TabsTrigger>
              </TabsList>
              <TabsContent value="request">
                <Card className="bg-zinc-950 border-none">
                  <CardContent className="pt-6">
                    <pre className="text-zinc-300 font-mono text-sm overflow-x-auto">
                      <code>{`curl -X GET "${window.location.origin}/api/public/products" \\
  -H "x-api-key: seu_token_aqui"`}</code>
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="response">
                <Card className="bg-zinc-950 border-none">
                  <CardContent className="pt-6">
                    <pre className="text-zinc-300 font-mono text-sm overflow-x-auto">
                      <code>{productsExample}</code>
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>

          {/* Webhooks */}
          <section id="webhooks" className="scroll-mt-20 space-y-6">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Webhooks</h2>
            </div>
            <p>
              O sistema envia payloads JSON via POST para as URLs configuradas sempre que um evento ocorre.
            </p>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Evento: sale.created</h3>
              <p>Disparado quando uma nova venda é finalizada.</p>
              <Card className="bg-zinc-950 border-none">
                <CardHeader className="py-3 border-b border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 text-xs font-mono">Payload Example</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-zinc-100" onClick={() => copyToClipboard(webhookExample)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <pre className="text-zinc-300 font-mono text-sm overflow-x-auto">
                    <code>{webhookExample}</code>
                  </pre>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="pt-12 border-t text-center">
            <p className="text-muted-foreground text-sm">
              Precisa de ajuda com a integração? Entre em contato com o suporte técnico.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
