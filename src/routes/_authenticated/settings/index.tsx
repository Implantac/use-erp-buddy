import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile, getTenantSettings } from "@/lib/settings.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Building, Shield, Key, Webhook, Copy, Trash2, Plus, ExternalLink } from "lucide-react";
import { getApiKeys, createApiKey, revokeApiKey } from "@/lib/api-keys.functions";
import { getWebhookSubscriptions, createWebhookSubscription, deleteWebhookSubscription } from "@/lib/webhooks.functions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

import { useState } from "react";

export const Route = createFileRoute("/_authenticated/settings/")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tab: (search.tab as string) || "profile",
    };
  },
  component: SettingsPage,
});

function SettingsPage() {
  const { tab } = Route.useSearch();
  const queryClient = useQueryClient();
  const { data: profile } = useSuspenseQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
  });

  const { data: tenant } = useSuspenseQuery({
    queryKey: ["tenant-settings"],
    queryFn: () => getTenantSettings(),
  });

  const [fullName, setFullName] = useState(profile?.full_name || "");

  const profileMutation = useMutation({
    mutationFn: (vars: { full_name: string }) => updateProfile({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Perfil atualizado com sucesso.");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar perfil: " + (error.message || "Tente novamente."));
    }
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências pessoais e da organização.
        </p>
      </div>

      <Tabs defaultValue={tab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Organização
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="developer" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Desenvolvedor
          </TabsTrigger>
          <TabsTrigger value="automations" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Automações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seu Perfil</CardTitle>
              <CardDescription>
                Informações visíveis para outros membros da equipe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xl">
                    {profile?.full_name?.substring(0, 2).toUpperCase() || "US"}
                  </AvatarFallback>
                </Avatar>

                <Button variant="outline" onClick={() => toast.info("Upload de imagem em breve!")}>
                  Alterar Avatar
                </Button>
              </div>

              <div className="grid gap-4 max-w-md">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input 
                    id="fullName" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input 
                    id="email" 
                    value="E-mail gerido pelo sistema" 
                    disabled 
                    className="bg-muted"
                  />

                  <p className="text-xs text-muted-foreground">
                    O e-mail não pode ser alterado por aqui.
                  </p>
                </div>
                <Button 
                  className="w-fit" 
                  onClick={() => profileMutation.mutate({ full_name: fullName })}
                  disabled={profileMutation.isPending || fullName === profile?.full_name}
                >
                  {profileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Tenant</CardTitle>
              <CardDescription>
                Configurações globais da sua instância.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="grid gap-2">
                <Label>Nome da Organização</Label>
                <Input value={tenant?.name || ""} disabled className="bg-muted" />
              </div>
              <div className="grid gap-2">
                <Label>Identificador (Slug)</Label>
                <Input value={tenant?.slug || ""} disabled className="bg-muted" />
              </div>
              <div className="pt-4">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  Plano Enterprise
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Autenticação</CardTitle>
              <CardDescription>
                Gerencie sua senha e sessões ativas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" onClick={() => toast.info("Redefinição de senha em breve!")}>
                Alterar Senha
              </Button>
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Segurança da Conta</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Último acesso detectado em: {new Date().toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="developer" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Chaves de API</CardTitle>
                <CardDescription>
                  Use estas chaves para integrar sistemas externos ao ERP.
                  <Button variant="link" size="sm" className="p-0 h-auto flex items-center gap-1 mt-1 text-primary" asChild>
                    <a href="/settings/docs">
                      <ExternalLink className="h-3 w-3" />
                      Ver documentação da API
                    </a>
                  </Button>
                </CardDescription>
              </div>
              <CreateApiKeyDialog tenantId={tenant?.id} onCreated={() => queryClient.invalidateQueries({ queryKey: ["api-keys"] })} />
            </CardHeader>
            <CardContent>
              <ApiKeysList />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Webhooks</CardTitle>
                <CardDescription>
                  Receba notificações em tempo real sobre eventos do sistema.
                </CardDescription>
              </div>
              <CreateWebhookDialog tenantId={tenant?.id} onCreated={() => queryClient.invalidateQueries({ queryKey: ["webhooks"] })} />
            </CardHeader>
            <CardContent>
              <WebhooksList />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="automations" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Regras de Automação</CardTitle>
                <CardDescription>
                  Configure gatilhos inteligentes para automatizar processos.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => toast.info("Criação de regras em breve!")}>
                <Plus className="h-4 w-4 mr-2" /> Nova Regra
              </Button>
            </CardHeader>
            <CardContent>
              <AutomationsList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApiKeysList() {
  const queryClient = useQueryClient();
  const { data: keys, isLoading } = useSuspenseQuery({
    queryKey: ["api-keys"],
    queryFn: () => getApiKeys(),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeApiKey({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("Chave revogada com sucesso.");
    }
  });

  if (isLoading) return <div className="py-4 text-center text-muted-foreground">Carregando chaves...</div>;
  if (!keys?.length) return <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">Nenhuma chave de API gerada.</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Label</TableHead>
          <TableHead>Prefixo</TableHead>
          <TableHead>Criada em</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {keys.map((key: any) => (
          <TableRow key={key.id}>
            <TableCell className="font-medium">{key.label}</TableCell>
            <TableCell><code>{key.key_prefix}***</code></TableCell>
            <TableCell>{new Date(key.created_at).toLocaleDateString()}</TableCell>
            <TableCell>
              <Badge variant={key.is_active ? "default" : "secondary"}>
                {key.is_active ? "Ativa" : "Revogada"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {key.is_active && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive"
                  onClick={() => revokeMutation.mutate(key.id)}
                  disabled={revokeMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function CreateApiKeyDialog({ tenantId, onCreated }: { tenantId?: string, onCreated: () => void }) {
  const [label, setLabel] = useState("");
  const [open, setOpen] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (vars: { label: string, tenant_id: string }) => createApiKey({ data: vars }),
    onSuccess: (data) => {
      setNewKey(data.rawKey);
      onCreated();
    }
  });

  const handleCreate = () => {
    if (!tenantId) return;
    mutation.mutate({ label, tenant_id: tenantId });
  };

  const copyToClipboard = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      toast.success("Chave copiada!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setNewKey(null); setLabel(""); } }}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Gerar Chave</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Chave de API</DialogTitle>
          <DialogDescription>
            {newKey 
              ? "Copie sua chave agora. Por segurança, você não poderá vê-la novamente."
              : "Dê um nome para identificar onde esta chave será usada."}
          </DialogDescription>
        </DialogHeader>

        {newKey ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md border font-mono text-sm break-all">
              {newKey}
              <Button size="icon" variant="ghost" className="shrink-0" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-yellow-600 font-medium">
              Aviso: Se você perder esta chave, precisará gerar uma nova.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="label">Identificador</Label>
              <Input 
                id="label" 
                placeholder="Ex: Integração Site, App Mobile" 
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {newKey ? (
            <Button onClick={() => setOpen(false)}>Concluído</Button>
          ) : (
            <Button onClick={handleCreate} disabled={mutation.isPending || !label}>
              {mutation.isPending ? "Gerando..." : "Gerar"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WebhooksList() {
  const queryClient = useQueryClient();
  const { data: webhooks, isLoading } = useSuspenseQuery({
    queryKey: ["webhooks"],
    queryFn: () => getWebhookSubscriptions(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWebhookSubscription({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook removido.");
    }
  });

  if (isLoading) return <div className="py-4 text-center text-muted-foreground">Carregando webhooks...</div>;
  if (!webhooks?.length) return <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">Nenhum webhook configurado.</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Label</TableHead>
          <TableHead>URL de Destino</TableHead>
          <TableHead>Eventos</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {webhooks.map((wh: any) => (
          <TableRow key={wh.id}>
            <TableCell className="font-medium">{wh.label}</TableCell>
            <TableCell className="text-xs font-mono">{wh.target_url}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {wh.events.map((e: string) => (
                  <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>
                ))}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive"
                onClick={() => deleteMutation.mutate(wh.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function CreateWebhookDialog({ tenantId, onCreated }: { tenantId?: string, onCreated: () => void }) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: (vars: { label: string, target_url: string, tenant_id: string, events: string[] }) => 
      createWebhookSubscription({ data: vars }),
    onSuccess: () => {
      toast.success("Webhook configurado.");
      setOpen(false);
      onCreated();
      setLabel("");
      setUrl("");
    }
  });

  const handleCreate = () => {
    if (!tenantId) return;
    mutation.mutate({ 
      label, 
      target_url: url, 
      tenant_id: tenantId, 
      events: ["sale.created", "inventory.low"] 
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Novo Endpoint</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar Webhook</DialogTitle>
          <DialogDescription>
            Insira a URL para onde enviaremos as notificações de eventos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="wh-label">Identificador</Label>
            <Input 
              id="wh-label" 
              placeholder="Ex: Integração ERP, Slack Bot" 
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="url">URL de Destino</Label>
            <Input 
              id="url" 
              type="url"
              placeholder="https://api.seusistema.com/webhooks" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Por padrão, todos os eventos (Vendas e Estoque Baixo) serão enviados.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={handleCreate} disabled={mutation.isPending || !label || !url}>
            {mutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function AutomationsList() {
  const { data: rules } = useSuspenseQuery({
    queryKey: ["automation-rules"],
    queryFn: () => getAutomationRules(),
  });

  if (!rules?.length) return <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">Nenhuma regra de automação.</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Evento</TableHead>
          <TableHead>Ação</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rules.map((rule: any) => (
          <TableRow key={rule.id}>
            <TableCell className="font-medium">{rule.name}</TableCell>
            <TableCell>{rule.event_type}</TableCell>
            <TableCell>{rule.action_type}</TableCell>
            <TableCell><Badge variant={rule.is_active ? "default" : "secondary"}>{rule.is_active ? "Ativo" : "Inativo"}</Badge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

import { getAutomationRules } from "@/lib/automations.functions";
