import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getProductionFormulas, 
  getProductionOrders, 
  finishProductionOrder,
  updateProductionOrderStatus 
} from "@/lib/production.functions";
import { getProfile } from "@/lib/settings.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Factory, 
  Beaker, 
  Plus, 
  Play, 
  CheckCircle2, 
  Clock, 
  XCircle,
  MoreHorizontal,
  ArrowRight
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { CreateFormulaDialog } from "@/components/production/create-formula-dialog";
import { CreateProductionOrderDialog } from "@/components/production/create-order-dialog";

export const Route = createFileRoute("/_authenticated/production")({
  component: ProductionDashboard,
});

function ProductionDashboard() {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
  });

  const tenantId = ((profile as any)?.user_roles?.[0]?.tenant_id || (profile as any)?.tenant_id || "") as string;

  const { data: formulas, isLoading: loadingFormulas } = useQuery({
    queryKey: ["production-formulas"],
    queryFn: () => (getProductionFormulas() as Promise<any[]>),
  });

  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ["production-orders"],
    queryFn: () => (getProductionOrders() as Promise<any[]>),
  });

  const finishMutation = useMutation({
    mutationFn: (data: { order_id: string; quantity_produced: number }) => finishProductionOrder({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-history"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Ordem concluída e estoque atualizado!");
    },
    onError: (err: any) => {
      toast.error("Erro ao concluir: " + err.message);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { order_id: string; status: 'in_production' | 'cancelled' }) => updateProductionOrderStatus({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      toast.success("Status atualizado!");
    },
    onError: (err: any) => {
      toast.error("Erro ao atualizar status: " + err.message);
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return <Badge variant="outline" className="text-blue-500 border-blue-500/20 gap-1"><Clock className="h-3 w-3" /> Planejado</Badge>;
      case 'in_production':
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 gap-1"><Play className="h-3 w-3" /> Em Produção</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 gap-1"><CheckCircle2 className="h-3 w-3" /> Concluído</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produção Industrial</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de fórmulas, ordens de produção e transformação de insumos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tenantId && (
            <>
              <CreateFormulaDialog tenantId={tenantId} />
              <CreateProductionOrderDialog tenantId={tenantId} />
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ordens Ativas</CardTitle>
            <Play className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(orders as any[])?.filter(o => ['planned', 'in_production'].includes(o.status)).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fórmulas Ativas</CardTitle>
            <Beaker className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formulas?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Concluídas (Mês)</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(orders as any[])?.filter(o => o.status === 'completed').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Eficiência</CardTitle>
            <Factory className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Ordens de Produção</TabsTrigger>
          <TabsTrigger value="formulas">Fórmulas (BOM)</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Produção</CardTitle>
              <CardDescription>Acompanhe o status da fabricação de seus produtos.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto Final</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Meta</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingOrders ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow>
                  ) : orders?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma ordem encontrada.</TableCell></TableRow>
                  ) : (
                    orders?.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date((order as any).created_at || new Date()), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{(order.products as any)?.name || 'Produto não encontrado'}</span>
                            <span className="text-[10px] text-muted-foreground">{(order.product_formulas as any)?.name || 'Sem fórmula'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge((order as any).status || '')}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {order.quantity_target}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {(order as any).status === 'planned' && (
                                <DropdownMenuItem 
                                  className="gap-2 text-primary"
                                  onClick={() => updateStatusMutation.mutate({ order_id: (order as any).id || '', status: 'in_production' })}
                                >
                                  <Play className="h-4 w-4" /> Iniciar Produção
                                </DropdownMenuItem>
                              )}
                              {(order as any).status === 'in_production' && (
                                <DropdownMenuItem 
                                  className="gap-2 text-green-600"
                                  onClick={() => {
                                    const qty = prompt("Quantidade produzida:", (order as any).quantity_target?.toString());
                                    if (qty) finishMutation.mutate({ order_id: (order as any).id || '', quantity_produced: parseFloat(qty) });
                                  }}
                                >
                                  <CheckCircle2 className="h-4 w-4" /> Concluir Produção
                                </DropdownMenuItem>
                              )}
                              {['planned', 'in_production'].includes((order as any).status || '') && (
                                <DropdownMenuItem 
                                  className="gap-2 text-destructive"
                                  onClick={() => {
                                    if (confirm("Deseja realmente cancelar esta ordem?")) {
                                      updateStatusMutation.mutate({ order_id: (order as any).id || '', status: 'cancelled' });
                                    }
                                  }}
                                >
                                  <XCircle className="h-4 w-4" /> Cancelar Ordem
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="gap-2">
                                <ArrowRight className="h-4 w-4" /> Ver Componentes
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formulas">
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loadingFormulas ? (
              <div className="col-span-full text-center py-8">Carregando fórmulas...</div>
            ) : formulas?.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">Nenhuma fórmula cadastrada.</div>
            ) : (
              formulas?.map((formula) => (
                <Card key={formula.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Beaker className="h-5 w-5" />
                      </div>
                    </div>
                    <CardTitle className="mt-4">{formula.name}</CardTitle>
                    <CardDescription>Produz: {(formula.products as any)?.name || 'Produto não encontrado'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Insumos:</p>
                      {formula.formula_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-xs border-b border-border/50 pb-1">
                          <span>{item.products?.name}</span>
                          <span className="font-mono text-primary">{item.quantity} {item.products?.unit_of_measure}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
