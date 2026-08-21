import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAutomationRules, createAutomationRule } from "@/lib/automations.functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Zap, Activity, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/settings/automations")({
  component: AutomationsSettings,
});

function AutomationsSettings() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: rules, isLoading } = useQuery({
    queryKey: ["automation-rules"],
    queryFn: () => getAutomationRules(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createAutomationRule({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      setIsOpen(false);
      toast.success("Regra de automação criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar regra: ${error.message}`);
    },
  });

  const [newRule, setNewRule] = useState({
    name: "",
    entity_type: "sales",
    event_type: "INSERT",
    action_type: "NOTIFY",
    action_config: { message: "" }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newRule);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automações</h1>
          <p className="text-muted-foreground">
            Configure regras proativas e fluxos de trabalho inteligentes.
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Criar Regra de Automação</DialogTitle>
                <DialogDescription>
                  Defina um gatilho e uma ação para automatizar seu processo.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome da Regra</Label>
                  <Input 
                    id="name" 
                    placeholder="Ex: Notificar Venda Grande" 
                    value={newRule.name}
                    onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Entidade</Label>
                    <Select 
                      value={newRule.entity_type}
                      onValueChange={(val) => setNewRule({...newRule, entity_type: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">Vendas</SelectItem>
                        <SelectItem value="inventory_transactions">Estoque</SelectItem>
                        <SelectItem value="purchase_orders">Compras</SelectItem>
                        <SelectItem value="products">Produtos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Evento</Label>
                    <Select 
                      value={newRule.event_type}
                      onValueChange={(val) => setNewRule({...newRule, event_type: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INSERT">Criação</SelectItem>
                        <SelectItem value="UPDATE">Atualização</SelectItem>
                        <SelectItem value="DELETE">Exclusão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Ação</Label>
                  <Select 
                    value={newRule.action_type}
                    onValueChange={(val) => setNewRule({...newRule, action_type: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOTIFY">Notificação Interna</SelectItem>
                      <SelectItem value="EMAIL">Enviar Email</SelectItem>
                      <SelectItem value="WEBHOOK">Disparar Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="message">Mensagem da Notificação</Label>
                  <Input 
                    id="message" 
                    placeholder="Mensagem customizada..." 
                    value={newRule.action_config.message}
                    onChange={(e) => setNewRule({
                      ...newRule, 
                      action_config: { ...newRule.action_config, message: e.target.value }
                    })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Salvar Regra"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <p>Carregando regras...</p>
        ) : rules?.length === 0 ? (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <Zap className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground font-medium">Nenhuma automação configurada.</p>
              <p className="text-sm text-muted-foreground mt-1">Crie sua primeira regra para começar a otimizar processos.</p>
            </CardContent>
          </Card>
        ) : (
          rules?.map((rule: any) => (
            <Card key={rule.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <CardDescription>
                      Gatilho: {rule.entity_type} ({rule.event_type})
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={rule.is_active ? "default" : "secondary"}>
                  {rule.is_active ? "Ativa" : "Inativa"}
                </Badge>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5" />
                    <span>Ação: {rule.action_type}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Info className="h-3.5 w-3.5" />
                    <span>{rule.action_config?.message || "Sem mensagem customizada"}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Editar</Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">Pausar</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}