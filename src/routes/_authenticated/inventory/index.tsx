import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, useQuery } from "@tanstack/react-query";
import { getInventoryHistory, createInventoryTransaction } from "@/lib/inventory.functions";
import { getProducts } from "@/lib/products.functions";
import { getMyUnits } from "@/lib/units.functions";
import { getProfile } from "@/lib/settings.functions";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, History, ArrowDownLeft, ArrowUpRight, Scale, Repeat } from "lucide-react";

export const Route = createFileRoute("/_authenticated/inventory/")({
  component: InventoryPage,
});

const transactionSchema = z.object({
  product_id: z.string().uuid("Selecione um produto"),
  unit_id: z.string().uuid("Selecione uma unidade"),
  type: z.enum(["in", "out", "adjustment", "transfer"]),
  quantity: z.coerce.number().min(0.01, "A quantidade deve ser maior que zero"),
  notes: z.string().optional(),
  destination_unit_id: z.string().uuid("Selecione a unidade de destino").optional(),
}).refine((data) => {
  if (data.type === 'transfer' && !data.destination_unit_id) return false;
  if (data.type === 'transfer' && data.unit_id === data.destination_unit_id) return false;
  return true;
}, {
  message: "Para transferências, selecione uma unidade de destino diferente da origem",
  path: ["destination_unit_id"]
});


type TransactionFormValues = z.infer<typeof transactionSchema>;

function InventoryPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: history } = useSuspenseQuery({
    queryKey: ["inventory-history"],
    queryFn: () => getInventoryHistory({ data: { limit: 50 } }),
  });

  const { data: productsData } = useQuery({
    queryKey: ["products", { onlyActive: true }],
    queryFn: () => getProducts({ data: { page: 1, pageSize: 100 } }),
  });

  const { data: unitsData } = useQuery({
    queryKey: ["units", { isActive: true }],
    queryFn: () => getMyUnits({ data: { page: 1, pageSize: 100, isActive: true } }),
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(undefined),
  });

  const tenantId = (profile as any)?.tenant_id;

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "in",
      quantity: 0,
      notes: "",
    },
  });

  async function onSubmit(values: TransactionFormValues) {
    if (!tenantId) return;
    try {
      setLoading(true);
      await createInventoryTransaction({
        data: {
          ...values,
          tenant_id: tenantId,
        },
      });
      toast.success("Movimentação registrada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["inventory-history"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Erro ao registrar movimentação");
    } finally {
      setLoading(false);
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "in":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 flex items-center gap-1 w-fit"><ArrowDownLeft className="h-3 w-3" /> Entrada</Badge>;
      case "out":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 flex items-center gap-1 w-fit"><ArrowUpRight className="h-3 w-3" /> Saída</Badge>;
      case "adjustment":
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 flex items-center gap-1 w-fit"><Scale className="h-3 w-3" /> Ajuste</Badge>;
      case "transfer":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 flex items-center gap-1 w-fit"><Repeat className="h-3 w-3" /> Transf.</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estoque</h1>
          <p className="text-muted-foreground">
            Gerencie as movimentações de entrada e saída de produtos.
          </p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Movimentação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Movimentação</DialogTitle>
              <DialogDescription>
                Informe os detalhes da movimentação de estoque.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="product_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produto</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined} value={field.value ?? undefined}>

                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o produto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {productsData?.products?.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unit_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined} value={field.value ?? undefined}>


                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a unidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {unitsData?.units?.map((u) => (
                              <SelectItem key={u.id} value={u.id!}>{u.name}</SelectItem>
                            ))}

                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined} value={field.value ?? undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="in">Entrada (+)</SelectItem>
                            <SelectItem value="out">Saída (-)</SelectItem>
                            <SelectItem value="adjustment">Ajuste</SelectItem>
                            <SelectItem value="transfer">Transferência</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {form.watch("type") === "transfer" && (
                  <FormField
                    control={form.control}
                    name="destination_unit_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade de Destino</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined} value={field.value ?? undefined}>

                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o destino" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {unitsData?.units?.filter(u => u.id !== form.watch("unit_id")).map((u) => (
                              <SelectItem key={u.id} value={u.id!}>{u.name}</SelectItem>
                            ))}

                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Input placeholder="Motivo, número da nota, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Processando..." : "Confirmar Movimentação"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Histórico Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead>Obs.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history?.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(tx.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">{tx.products?.name}</TableCell>
                  <TableCell>{tx.units?.name}</TableCell>
                  <TableCell>{getTypeBadge(tx.type)}</TableCell>
                  <TableCell className={`text-right font-bold ${tx.type === 'in' ? 'text-green-600' : tx.type === 'out' ? 'text-red-600' : ''}`}>
                    {tx.type === 'out' ? '-' : tx.type === 'in' ? '+' : ''}{tx.quantity}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {tx.notes || "-"}
                  </TableCell>
                </TableRow>
              ))}
              {history?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma movimentação encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}