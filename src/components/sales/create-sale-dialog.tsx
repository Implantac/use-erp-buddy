import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { ShoppingCart, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { createSale } from "@/lib/sales.functions";
import { getCustomers } from "@/lib/crm.functions";
import { getProducts } from "@/lib/products.functions";

const saleItemSchema = z.object({
  product_id: z.string().uuid("Selecione um produto"),
  quantity: z.coerce.number().min(0.01, "A quantidade deve ser maior que zero"),
  unit_price: z.coerce.number().min(0.01, "O preço deve ser maior que zero"),
});

const saleSchema = z.object({
  customer_id: z.string().optional().nullable(),
  items: z.array(saleItemSchema).min(1, "Adicione pelo menos um item"),
  discount_amount: z.coerce.number().min(0).default(0),
});

type SaleFormValues = z.infer<typeof saleSchema>;

export function CreateSaleDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: customers } = useQuery({
    queryKey: ["customers", { active: true }],
    queryFn: () => getCustomers({ data: { active: true } }),
  });

  const { data: productsData } = useQuery({
    queryKey: ["products", { pageSize: 100 }],
    queryFn: () => getProducts({ data: { pageSize: 100 } }),
  });

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      customer_id: "none",
      items: [{ product_id: "", quantity: 1, unit_price: 0 }],
      discount_amount: 0,
    },
  });

  const { watch, setValue, control, handleSubmit, reset, formState: { errors } } = form;
  const items = watch("items") || [];

  const addItem = () => {
    setValue("items", [...items, { product_id: "", quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setValue("items", newItems);
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = productsData?.products?.find((p) => p.id === productId);
    if (product) {
      const newItems = [...items];
      newItems[index] = {
        product_id: productId,
        quantity: newItems[index].quantity,
        unit_price: product.price || 0,
      };
      setValue("items", newItems);
    }
  };

  const total = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const discount = watch("discount_amount") || 0;
  const finalTotal = total - discount;

  async function onSubmit(values: SaleFormValues) {
    try {
      setLoading(true);
      await createSale({
        data: {
          tenant_id: tenantId,
          customer_id: values.customer_id === "none" ? undefined : (values.customer_id || undefined),
          items: values.items,
          discount_amount: values.discount_amount,
        },
      });
      toast.success("Venda registrada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setOpen(false);
      reset();
    } catch (error: any) {
      toast.error(error.message || "Erro ao registrar venda");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Nova Venda
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Venda</DialogTitle>
          <DialogDescription>
            Registre uma nova venda e atualize estoque e financeiro.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "none"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente (Opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Consumidor Final</SelectItem>
                      {customers?.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Itens da Venda</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end border p-3 rounded-lg bg-muted/30">
                  <div className="col-span-5">
                    <FormLabel className="text-xs">Produto</FormLabel>
                    <Select 
                      onValueChange={(val) => handleProductChange(index, val)} 
                      value={item.product_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {productsData?.products?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <FormLabel className="text-xs">Qtd</FormLabel>
                    <Input 
                      type="number" 
                      min="1" 
                      value={item.quantity} 
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].quantity = Number(e.target.value);
                        setValue("items", newItems);
                      }}
                    />
                  </div>
                  <div className="col-span-3">
                    <FormLabel className="text-xs">Preço Unit.</FormLabel>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={item.unit_price} 
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].unit_price = Number(e.target.value);
                        setValue("items", newItems);
                      }}
                    />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {errors.items && (
                <p className="text-sm font-medium text-destructive">{errors.items.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <FormField
                control={control}
                name="discount_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desconto (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? 0} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col justify-end items-end text-right">
                <span className="text-sm text-muted-foreground">Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span>
                <span className="text-lg font-bold">Final: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalTotal)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Processando..." : "Finalizar Venda"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
