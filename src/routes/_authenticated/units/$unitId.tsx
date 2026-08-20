import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyUnits } from "@/lib/units.functions";
import { getMyCompanies } from "@/lib/companies.functions";
import { getMyTenants } from "@/lib/tenants.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/units/$unitId")({
  component: UnitEdit,
});

function UnitEdit() {
  const { unitId } = useParams({ from: "/_authenticated/units/$unitId" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data } = useSuspenseQuery({
    queryKey: ["units", 1], // Fetch first page to find the unit if not already in cache
    queryFn: () => getMyUnits({ data: { page: 1, pageSize: 100 } }),
  });

  const units = data?.units || [];

  const { data: companies } = useSuspenseQuery({
    queryKey: ["companies"],
    queryFn: () => getMyCompanies(),
  });

  const { data: tenants } = useSuspenseQuery({
    queryKey: ["my-tenants"],
    queryFn: () => getMyTenants(),
  });

  const unit = units.find((u) => u.id === unitId);
  
  const [formData, setFormData] = useState({
    name: "",
    company_id: "",
    tenant_id: "",
    type: "",
  });

  useEffect(() => {
    if (unit) {
      setFormData({
        name: unit.name || "",
        company_id: unit.company_id || "",
        tenant_id: unit.tenant_id || "",
        type: unit.type || "",
      });
    }
  }, [unit]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("units")
        .update(data)
        .eq("id", unitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success("Unidade atualizada com sucesso!");
      navigate({ to: "/units" });
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  if (!unit) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <h2 className="text-xl font-semibold">Unidade não encontrada</h2>
        <Button onClick={() => navigate({ to: "/units" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para listagem
        </Button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/units" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Unidade</h1>
          <p className="text-muted-foreground">
            {unit.name} • {unit.type}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Informações da Unidade
            </CardTitle>
            <CardDescription>
              Atualize os dados da unidade organizacional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Unidade</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Filial São Paulo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="Ex: Matriz, Filial, Depósito"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Empresa Responsável</Label>
                <select
                  id="company"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                  required
                >
                  <option value="">Selecione uma empresa</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenant">Tenant</Label>
                <select
                  id="tenant"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.tenant_id}
                  onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                  required
                >
                  <option value="">Selecione um tenant</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/units" })}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar Alterações
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
