import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { createUnit } from "@/lib/units.functions";
import { getMyCompanies } from "@/lib/companies.functions";
import { getMyTenants } from "@/lib/tenants.functions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export function CreateUnitDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // Use useQuery instead of useSuspenseQuery for better dialog experience
  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => getMyCompanies(),
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["my-tenants"],
    queryFn: () => getMyTenants(),
  });

  const [formData, setFormData] = useState({
    name: "",
    company_id: "",
    tenant_id: "",
    type: "Matriz",
    is_active: true,
  });

  // Update defaults when data arrives
  useEffect(() => {
    if (companies.length > 0 && !formData.company_id) {
        setFormData(prev => ({ ...prev, company_id: companies[0].id }));
    }
    if (tenants.length > 0 && !formData.tenant_id) {
        setFormData(prev => ({ ...prev, tenant_id: tenants[0].id }));
    }
  }, [companies, tenants, formData.company_id, formData.tenant_id]);

  const createMutation = useMutation({
    mutationFn: (data: any) => createUnit({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success("Unidade criada com sucesso!");
      setOpen(false);
      setFormData({
        name: "",
        company_id: companies?.[0]?.id || "",
        tenant_id: tenants?.[0]?.id || "",
        type: "Matriz",
        is_active: true,
      });
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Unidade
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nova Unidade</DialogTitle>
            <DialogDescription>
              Cadastre uma nova unidade organizacional preenchendo os dados abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Unidade</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Filial São Paulo"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo</Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="Ex: Matriz, Filial"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company">Empresa</Label>
              <select
                id="company"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                required
              >
                <option value="">Selecione uma empresa</option>
                {companies.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tenant">Tenant</Label>
              <select
                id="tenant"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.tenant_id}
                onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                required
              >
                <option value="">Selecione um tenant</option>
                {tenants.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="is-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is-active">Unidade Ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Criar Unidade
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
