import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Factory } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { getProductionFormulas, createProductionOrder } from "@/lib/production.functions";
import { getMyCompanies } from "@/lib/companies.functions";
import { getMyUnits } from "@/lib/units.functions";
import { toast } from "sonner";

export function CreateProductionOrderDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    company_id: "",
    unit_id: "",
    formula_id: "",
    quantity_target: 1,
    notes: ""
  });

  const { data: formulas } = useQuery({
    queryKey: ["production-formulas"],
    queryFn: () => getProductionFormulas(),
  });

  const { data: companies } = useQuery({
    queryKey: ["companies"],
    queryFn: () => getMyCompanies(),
  });

  const { data: unitsData } = useQuery({
    queryKey: ["units", formData.company_id],
    queryFn: () => getMyUnits(undefined), // Should ideally filter by company but API doesn't support yet
    enabled: !!formData.company_id
  });

  const mutation = useMutation({
    mutationFn: (data: any) => createProductionOrder({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      toast.success("Ordem de produção criada!");
      setOpen(false);
      setFormData({
        company_id: "",
        unit_id: "",
        formula_id: "",
        quantity_target: 1,
        notes: ""
      });
    },
    onError: (err: any) => {
      toast.error("Erro ao criar: " + err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formula = formulas?.find(f => f.id === formData.formula_id);
    if (!formula) return;

    mutation.mutate({
      ...formData,
      target_product_id: formula.product_id
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Nova Ordem
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Ordem de Produção</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Empresa</Label>
            <Select 
              value={formData.company_id} 
              onValueChange={v => setFormData(prev => ({ ...prev, company_id: v, unit_id: "" }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies?.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Unidade de Produção</Label>
            <Select 
              value={formData.unit_id} 
              onValueChange={v => setFormData(prev => ({ ...prev, unit_id: v }))}
              disabled={!formData.company_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {unitsData?.units?.filter((u: any) => u.company_id === formData.company_id).map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fórmula (BOM)</Label>
            <Select 
              value={formData.formula_id} 
              onValueChange={v => setFormData(prev => ({ ...prev, formula_id: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a fórmula" />
              </SelectTrigger>
              <SelectContent>
                {formulas?.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name} ({f.products?.name})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qty">Quantidade Meta</Label>
            <Input 
              id="qty"
              type="number"
              value={formData.quantity_target}
              onChange={e => setFormData(prev => ({ ...prev, quantity_target: parseFloat(e.target.value) }))}
              min={1}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea 
              id="notes"
              placeholder="Instruções para o operador..."
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? "Criando..." : "Lançar Ordem"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
