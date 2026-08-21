import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Beaker } from "lucide-react";
import { getProducts } from "@/lib/products.functions";
import { createProductionFormula } from "@/lib/production.functions";
import { toast } from "sonner";


export function CreateFormulaDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    product_id: "",
    items: [{ component_product_id: "", quantity: 1 }]
  });

  const { data: productsData } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => getProducts({ data: { pageSize: 100 } }),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => createProductionFormula({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-formulas"] });
      toast.success("Fórmula criada com sucesso!");
      setOpen(false);
      setFormData({
        name: "",
        description: "",
        product_id: "",
        items: [{ component_product_id: "", quantity: 1 }]
      });
    },
    onError: (err: any) => {
      toast.error("Erro ao criar: " + err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id || formData.items.some(i => !i.component_product_id)) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    mutation.mutate(formData);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { component_product_id: "", quantity: 1 }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value } as any;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Beaker className="h-4 w-4" /> Nova Fórmula
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Fórmula (BOM)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Fórmula</Label>
              <Input 
                id="name" 
                placeholder="Ex: Mistura Padrão A" 
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Produto Final</Label>
              <Select 
                value={formData.product_id} 
                onValueChange={v => setFormData(prev => ({ ...prev, product_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {productsData?.products?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Descrição</Label>
            <Textarea 
              id="desc" 
              placeholder="Notas sobre o processo..." 
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Insumos e Componentes</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addItem} className="h-8 gap-1">
                <Plus className="h-3 w-3" /> Adicionar
              </Button>
            </div>
            
            {formData.items.map((item, index) => (
              <div key={index} className="flex gap-2 items-end border-b border-border/50 pb-4">
                <div className="flex-1 space-y-2">
                  <Label className="text-[10px] uppercase text-muted-foreground">Componente</Label>
                  <Select 
                    value={item.component_product_id} 
                    onValueChange={v => updateItem(index, 'component_product_id', v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {productsData?.products?.filter(p => p.id !== formData.product_id).map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-2">
                  <Label className="text-[10px] uppercase text-muted-foreground">Qtd.</Label>
                  <Input 
                    type="number" 
                    className="h-9"
                    value={item.quantity} 
                    onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value))}
                    min={0.001}
                    step={0.001}
                  />
                </div>
                {formData.items.length > 1 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeItem(index)}
                    className="h-9 w-9 text-destructive"
                  >
                    <Plus className="h-4 w-4 rotate-45" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? "Criando..." : "Criar Fórmula"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
