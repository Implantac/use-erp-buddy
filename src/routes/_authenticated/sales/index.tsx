import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSales, getSaleItems } from "@/lib/sales.functions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreateSaleDialog } from "@/components/sales/create-sale-dialog";
import { getProfile } from "@/lib/settings.functions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Info } from "lucide-react";


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
                <TableHead className="text-center">Itens</TableHead>
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
                    <TableCell className="text-center">
                      <SaleItemsPopover saleId={sale.id} />
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

function SaleItemsPopover({ saleId }: { saleId: string }) {
  const { data: items, isLoading } = useQuery({
    queryKey: ["sale-items", saleId],
    queryFn: () => getSaleItems({ data: { saleId } }),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Info className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Itens do Pedido</h4>
            <p className="text-xs text-muted-foreground">
              Detalhamento dos produtos desta venda.
            </p>
          </div>
          <div className="grid gap-2">
            {isLoading ? (
              <p className="text-xs">Carregando...</p>
            ) : items?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between text-sm border-b pb-1 last:border-0">
                <div className="flex flex-col">
                  <span className="font-medium text-xs">{item.products?.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {item.quantity} x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price)}
                  </span>
                </div>
                <span className="font-semibold text-xs">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total_price)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

