import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSales } from "@/lib/sales.functions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreateSaleDialog } from "@/components/sales/create-sale-dialog";
import { getProfile } from "@/lib/settings.functions";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/sales/")({
  component: SalesPage,
});

function SalesPage() {
  const { data: sales, isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: () => getSales({ data: { limit: 50 } }),
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(undefined),
  });

  const tenantId = (profile as any)?.user_roles?.[0]?.tenant_id || (profile as any)?.tenant_id;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendas</h1>
          <p className="text-muted-foreground">Histórico de pedidos e faturamento comercial.</p>
        </div>
        {tenantId && <CreateSaleDialog tenantId={tenantId} />}
      </div>


      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell>
                </TableRow>
              ) : sales?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma venda registrada.</TableCell>
                </TableRow>
              ) : (
                sales?.map((sale: any) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {format(new Date(sale.created_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">{sale.customers?.name || "Consumidor Final"}</TableCell>
                    <TableCell>
                      <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'}>
                        {sale.status === 'completed' ? 'Concluída' : sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.final_amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Receipt className="h-4 w-4" />
                      </Button>
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
