import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSuppliers } from "@/lib/suppliers.functions";
import { getPurchaseOrders, receivePurchaseOrder } from "@/lib/purchases.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Truck, 
  Plus, 
  Search, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Building2,
  Receipt
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreateSupplierDialog } from "@/components/purchases/create-supplier-dialog";
import { CreatePurchaseDialog } from "@/components/purchases/create-purchase-dialog";
import { getProfile } from "@/lib/settings.functions";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/_authenticated/purchases/")({
  component: PurchasesDashboard,
});

function PurchasesDashboard() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
  });

  const tenantId = profile?.tenant_id;

  
  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () => getPurchaseOrders({ data: {} }),
  });

  const receiveMutation = useMutation({
    mutationFn: (orderId: string) => receivePurchaseOrder({ data: { order_id: orderId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
      toast.success("Estoque atualizado e pagamento registrado!");
    },
    onError: (err: any) => {
      toast.error("Erro ao receber: " + err.message);
    }
  });


  const { data: suppliers, isLoading: loadingSuppliers } = useQuery({
    queryKey: ["suppliers", search],
    queryFn: () => getSuppliers({ data: { search } }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 gap-1"><CheckCircle2 className="h-3 w-3" /> Recebido</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Cancelado</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compras e Suprimentos</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de fornecedores, orders de compra e entrada de estoque.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tenantId && (
            <>
              <CreateSupplierDialog tenantId={tenantId} />
              <CreatePurchaseDialog tenantId={tenantId} />
            </>
          )}
        </div>

      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ordens Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders?.filter(o => o.status === 'pending').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total em Compras</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                orders?.reduce((acc, o) => acc + (o.total_amount || 0), 0) || 0
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fornecedores Ativos</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="orders" className="gap-2">
            <FileText className="h-4 w-4" />
            Ordens de Compra
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2">
            <Truck className="h-4 w-4" />
            Fornecedores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Histórico de Compras</CardTitle>
              <CardDescription>Acompanhe o status de suas aquisições e entregas.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
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
                        <TableCell className="font-medium">
                          {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{order.suppliers?.name || 'N/A'}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="gap-2">
                                <FileText className="h-4 w-4" /> Ver Detalhes
                              </DropdownMenuItem>
                              {order.status === 'pending' && (
                                <DropdownMenuItem 
                                  className="gap-2 text-green-600 focus:text-green-600"
                                  onClick={() => receiveMutation.mutate(order.id)}
                                >
                                  <Receipt className="h-4 w-4" /> Confirmar Recebimento
                                </DropdownMenuItem>
                              )}

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

        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex items-center gap-2 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar fornecedor..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loadingSuppliers ? (
              <div className="col-span-full text-center py-8">Carregando fornecedores...</div>
            ) : suppliers?.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">Nenhum fornecedor cadastrado.</div>
            ) : (
              suppliers?.map((supplier) => (
                <Card key={supplier.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <Badge variant="outline">{supplier.tax_id || 'Sem Documento'}</Badge>
                    </div>
                    <CardTitle className="mt-4">{supplier.name}</CardTitle>
                    <CardDescription>{supplier.email || 'Sem e-mail'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{supplier.phone || 'Telefone não informado'}</p>
                      <p className="truncate">{supplier.address || 'Endereço não informado'}</p>
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
