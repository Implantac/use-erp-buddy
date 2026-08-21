import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPurchaseOrder } from "@/lib/purchases.functions";
import { getSuppliers } from "@/lib/suppliers.functions";
import { getProducts } from "@/lib/products.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export function CreatePurchaseDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<{ product_id: string; quantity: number; unit_price: number }[]>([
    { product_id: "", quantity: 1, unit_price: 0 },
  ]);

  const queryClient = useQueryClient();

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => getSuppliers({ data: {} }),
  });

  const { data: productsData } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => getProducts({ data: { pageSize: 100 } }),
  });

  const products = productsData?.products || [];

  const mutation = useMutation({
    mutationFn: (vars: any) => createPurchaseOrder({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Ordem de compra criada!");
      setOpen(false);
      setSupplierId("");
      setItems([{ product_id: "", quantity: 1, unit_price: 0 }]);
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  const addItem = () => {
    setItems([...items, { product_id: "", quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    const item = newItems[index];
    if (!item) return;

    (item as any)[field] = value;
    
    if (field === "product_id") {
      const product = products.find((p: any) => p.id === value);
      if (product) {
        item.unit_price = product.cost_price || product.price || 0;
      }
    }
    
    setItems(newItems);
  };

  const handleCreate = () => {
    if (!supplierId) {
      toast.error("Selecione um fornecedor");
      return;
    }
    if (items.some(i => !i.product_id)) {
      toast.error("Selecione os produtos");
      return;
    }

    mutation.mutate({
      tenant_id: tenantId,
      supplier_id: supplierId,
      items
    });
  };


  const total = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Ordem de Compra
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Criar Ordem de Compra</DialogTitle>
          <DialogDescription>
            Selecione o fornecedor e adicione os itens para repor seu estoque.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Fornecedor</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {suppliers?.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Itens da Compra</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-end border-b pb-3 last:border-0">
                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px]">Produto</Label>
                    <Select 
                      value={item.product_id} 
                      onValueChange={(val) => updateItem(index, "product_id", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20 space-y-1">
                    <Label className="text-[10px]">Qtd</Label>
                    <Input 
                      type="number" 
                      value={item.quantity} 
                      onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                    />
                  </div>
                  <div className="w-28 space-y-1">
                    <Label className="text-[10px]">Preço Unit.</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={item.unit_price} 
                      onChange={(e) => updateItem(index, "unit_price", Number(e.target.value))}
                    />
                  </div>
                  {items.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive h-10 w-10 shrink-0" 
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
          <div className="text-sm">
            Total: <span className="font-bold text-lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span>
          </div>
          <Button onClick={handleCreate} disabled={mutation.isPending}>
            {mutation.isPending ? "Criando..." : "Criar Ordem"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
