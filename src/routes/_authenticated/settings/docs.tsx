import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Copy, ExternalLink, Key, Code, Webhook, FileJson, Play, Send, RefreshCw, CheckCircle2, XCircle, Filter, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import React, { Suspense, useState, useEffect } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWebhookSubscriptions } from "@/lib/webhooks.functions";
import { simulateWebhook, getWebhookLogs, resendWebhook } from "@/lib/webhook-simulation.functions";

const SwaggerUI = React.lazy(() => import("swagger-ui-react"));
import "swagger-ui-react/swagger-ui.css";


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
            <Button variant="ghost" className="w-full justify-start font-normal" asChild>
              <a href="#playground">Playground (Swagger)</a>
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
            <Button variant="ghost" className="w-full justify-start font-normal" asChild>
              <a href="#webhook-simulator">Simulador</a>
            </Button>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Recursos</h4>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
              <a href="/api/public/openapi" target="_blank" rel="noopener noreferrer">
                <FileJson className="h-4 w-4" />
                OpenAPI Spec
              </a>
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
          
          {/* Swagger UI Playground */}
          <section id="playground" className="scroll-mt-20 space-y-4">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">API Playground</h2>
            </div>
            <p>
              Teste os endpoints em tempo real usando a interface interativa abaixo. 
              Use o botão <strong>Authorize</strong> para inserir sua API Key.
            </p>
            <Card className="overflow-hidden border-muted-foreground/20 shadow-sm">
              <CardContent className="p-0 bg-white">
                <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Carregando interface do Swagger...</div>}>
                  <div className="swagger-ui-container py-4">
                    <style>{`
                      .swagger-ui .topbar { display: none }
                      .swagger-ui .info { margin: 20px 0 }
                      .swagger-ui .scheme-container { background: transparent; box-shadow: none; padding: 20px 0 }
                    `}</style>
                    <SwaggerUI url="/api/public/openapi" />
                  </div>
                </Suspense>
              </CardContent>
            </Card>
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

          {/* Webhook Simulator */}
          <section id="webhook-simulator" className="scroll-mt-20 space-y-6">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Simulador de Webhooks</h2>
            </div>
            <p>
              Teste sua integração simulando disparos de eventos para seus endpoints configurados.
            </p>
            <WebhookSimulator />
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

function WebhookSimulator() {
  const queryClient = useQueryClient();
  const [selectedSub, setSelectedSub] = useState<string>("");
  const [event, setEvent] = useState<string>("sale.created");
  const [payload, setPayload] = useState<string>("");

  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failure">("all");
  const [eventFilter, setEventFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 5;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: subs } = useSuspenseQuery({
    queryKey: ["webhook-subscriptions"],
    queryFn: () => getWebhookSubscriptions(),
  });

  const { data: logsData, refetch: refetchLogs } = useSuspenseQuery({
    queryKey: ["webhook-logs", selectedSub, page, statusFilter, eventFilter, debouncedSearch],
    queryFn: () => selectedSub 
      ? getWebhookLogs({ data: { subscription_id: selectedSub, page, pageSize, status: statusFilter, event: eventFilter, search: debouncedSearch } }) 
      : Promise.resolve({ data: [], total: 0, page: 0, pageSize }),
  });

  const logs = logsData?.data || [];
  const total = logsData?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  useEffect(() => {
    setPage(0);
  }, [selectedSub, statusFilter, eventFilter, debouncedSearch]);

  useEffect(() => {
    if (event === "sale.created") {
      setPayload(JSON.stringify({
        id: "sale_" + Math.random().toString(36).substring(7),
        total: 150.75,
        currency: "BRL",
        customer: { name: "Cliente Teste", email: "teste@example.com" }
      }, null, 2));
    } else if (event === "inventory.low") {
      setPayload(JSON.stringify({
        product_id: "prod_" + Math.random().toString(36).substring(7),
        sku: "TEST-SKU-001",
        current_stock: 3,
        min_stock: 5
      }, null, 2));
    }
  }, [event]);

  const simulationMutation = useMutation({
    mutationFn: (vars: { subscription_id: string, event: string, payload: any }) => simulateWebhook({ data: vars }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Webhook disparado com sucesso!");
      } else {
        toast.error(`Falha no disparo: Status ${data.status}`);
      }
      refetchLogs();
    },
    onError: (err: any) => {
      toast.error("Erro na simulação: " + err.message);
    }
  });

  const resendMutation = useMutation({
    mutationFn: (logId: string) => resendWebhook({ data: { log_id: logId } }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Webhook reenviado com sucesso!");
      } else {
        toast.error(`Falha no reenvio: Status ${data.status}`);
      }
      refetchLogs();
    },
    onError: (err: any) => {
      toast.error("Erro ao reenviar: " + err.message);
    }
  });

  const handleSimulate = () => {
    if (!selectedSub) {
      toast.error("Selecione um endpoint");
      return;
    }
    try {
      const parsedPayload = JSON.parse(payload);
      simulationMutation.mutate({
        subscription_id: selectedSub,
        event,
        payload: parsedPayload
      });
    } catch (e) {
      toast.error("Payload JSON inválido");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configurar Simulação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Endpoint de Destino</Label>
            <Select value={selectedSub} onValueChange={setSelectedSub}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um webhook configurado" />
              </SelectTrigger>
              <SelectContent>
                {subs?.map((sub: any) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.label} ({sub.target_url})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Evento</Label>
            <Select value={event} onValueChange={setEvent}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sale.created">sale.created</SelectItem>
                <SelectItem value="inventory.low">inventory.low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Payload (JSON)</Label>
            <textarea
              className="flex min-h-[200px] w-full rounded-md border border-input bg-zinc-950 px-3 py-2 text-sm text-zinc-300 font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
            />
          </div>
          <Button 
            className="w-full" 
            onClick={handleSimulate}
            disabled={simulationMutation.isPending || !selectedSub}
          >
            {simulationMutation.isPending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Simular Disparo
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Histórico de Entregas</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => refetchLogs()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar em eventos ou payload..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3 w-3 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                <SelectTrigger className="h-8 text-xs w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="failure">Falhas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={eventFilter || "all"} onValueChange={(val: any) => setEventFilter(val === "all" ? undefined : val)}>
                <SelectTrigger className="h-8 text-xs w-[130px]">
                  <SelectValue placeholder="Evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Eventos</SelectItem>
                  <SelectItem value="sale.created">sale.created</SelectItem>
                  <SelectItem value="inventory.low">inventory.low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[450px] pr-4">
            {!selectedSub ? (
              <div className="text-center py-12 text-muted-foreground">
                Selecione um endpoint para ver os logs
              </div>
            ) : !logs?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma entrega registrada para este endpoint
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log: any) => (
                  <div key={log.id} className="p-3 border rounded-lg space-y-2 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {log.is_success ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                        <span className="text-xs font-mono font-bold uppercase">{log.event_type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={log.is_success ? "outline" : "destructive"} className="text-[10px]">
                          HTTP {log.response_status}
                        </Badge>
                        {!log.is_success && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-muted-foreground hover:text-primary"
                            onClick={() => resendMutation.mutate(log.id)}
                            disabled={resendMutation.isPending}
                            title="Reenviar agora"
                          >
                            <RefreshCw className={`h-3 w-3 ${resendMutation.isPending ? 'animate-spin' : ''}`} />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                    {log.response_body && (
                      <div className="mt-2 text-[10px] font-mono bg-zinc-950 text-zinc-400 p-2 rounded max-h-20 overflow-hidden">
                        {log.response_body}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
        {selectedSub && totalPages > 1 && (
          <CardFooter className="flex items-center justify-between pt-4 border-t px-6 py-4">
            <div className="text-xs text-muted-foreground">
              Total: {total} logs
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium">
                {page + 1} de {totalPages}
              </span>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

