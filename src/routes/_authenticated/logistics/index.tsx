import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getShipments, getCarriers, updateShipmentStatus } from "@/lib/logistics.functions";
import { getProfile } from "@/lib/settings.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Box, 
  Truck, 
  CheckCircle2, 
  Clock, 
  XCircle,
  MoreHorizontal,
  PackageCheck,
  MapPin,
  Calendar
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

export const Route = createFileRoute("/_authenticated/logistics/")({
  component: LogisticsDashboard,
});

function LogisticsDashboard() {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
  });

  const { data: shipments, isLoading: loadingShipments } = useQuery({
    queryKey: ["shipments"],
    queryFn: () => (getShipments() as Promise<any[]>),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { shipment_id: string; status: 'shipped' | 'delivered' | 'returned'; location?: string }) => 
      updateShipmentStatus({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      toast.success("Status de entrega atualizado!");
    },
    onError: (err: any) => {
      toast.error("Erro ao atualizar status: " + err.message);
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500/20 gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>;
      case 'shipped':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1"><Truck className="h-3 w-3" /> Em Trânsito</Badge>;
      case 'delivered':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 gap-1"><PackageCheck className="h-3 w-3" /> Entregue</Badge>;
      case 'returned':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Devolvido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logística & Expedição</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de fretes, transportadoras e rastreamento de entregas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Truck className="h-4 w-4" /> Transportadoras
          </Button>
          <Button className="gap-2">
            <Box className="h-4 w-4" /> Novo Despacho
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Despachos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {shipments?.filter(s => s.status === 'pending').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Trânsito</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {shipments?.filter(s => s.status === 'shipped').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entregues (Mês)</CardTitle>
            <PackageCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {shipments?.filter(s => s.status === 'delivered').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prazo Médio</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2 dias</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Painel de Expedição</CardTitle>
          <CardDescription>Acompanhe o fluxo de saída de mercadorias.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venda</TableHead>
                <TableHead>Transportadora</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rastreio</TableHead>
                <TableHead>Prev. Entrega</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingShipments ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : shipments?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma expedição encontrada.</TableCell></TableRow>
              ) : (
                shipments?.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">Venda #{shipment.sale_id.slice(0, 8)}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {shipment.sales?.customers?.name || 'Consumidor Final'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span>{shipment.carriers?.name || 'Não atribuído'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-primary">{shipment.tracking_code || '-'}</span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {shipment.estimated_delivery ? format(new Date(shipment.estimated_delivery), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {shipment.status === 'pending' && (
                            <DropdownMenuItem 
                              className="gap-2 text-primary"
                              onClick={() => updateStatusMutation.mutate({ shipment_id: shipment.id, status: 'shipped' })}
                            >
                              <Truck className="h-4 w-4" /> Marcar como Enviado
                            </DropdownMenuItem>
                          )}
                          {shipment.status === 'shipped' && (
                            <DropdownMenuItem 
                              className="gap-2 text-green-600"
                              onClick={() => {
                                const loc = prompt("Local de entrega (opcional):");
                                updateStatusMutation.mutate({ shipment_id: shipment.id, status: 'delivered', location: loc || undefined });
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4" /> Confirmar Entrega
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="gap-2">
                            <MapPin className="h-4 w-4" /> Ver Histórico
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
    </div>
  );
}