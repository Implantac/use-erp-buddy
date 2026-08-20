import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyCompanies, updateCompany } from "@/lib/companies.functions";
import { getMyTenants } from "@/lib/tenants.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_authenticated/companies/$companyId")({
  component: CompanyEdit,
});

function CompanyEdit() {
  const { companyId } = useParams({ from: "/_authenticated/companies/$companyId" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: companies } = useSuspenseQuery({
    queryKey: ["companies"],
    queryFn: () => getMyCompanies(),
  });

  const { data: tenants } = useSuspenseQuery({
    queryKey: ["my-tenants"],
    queryFn: () => getMyTenants(),
  });

  const company = companies.find((c) => c.id === companyId);
  
  const [formData, setFormData] = useState({
    name: "",
    legal_name: "",
    tax_id: "",
    tenant_id: "",
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        legal_name: company.legal_name || "",
        tax_id: company.tax_id || "",
        tenant_id: company.tenant_id || "",
      });
    }
  }, [company]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateCompany({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Empresa atualizada com sucesso!");
      navigate({ to: "/companies" });
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <h2 className="text-xl font-semibold">Empresa não encontrada</h2>
        <Button onClick={() => navigate({ to: "/companies" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para listagem
        </Button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: companyId,
      updates: {
        name: formData.name,
        legal_name: formData.legal_name || null,
        tax_id: formData.tax_id || null,
        tenant_id: formData.tenant_id,
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/companies" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Empresa</h1>
          <p className="text-muted-foreground">
            {company.name} • {company.tax_id || "Sem Documento"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Informações Gerais
            </CardTitle>
            <CardDescription>
              Atualize os dados cadastrais da empresa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Fantasia</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Minha Empresa LTDA"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_id">CNPJ / ID Fiscal</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="legal_name">Razão Social</Label>
              <Input
                id="legal_name"
                value={formData.legal_name}
                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                placeholder="Nome jurídico completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant">Tenant Responsável</Label>
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

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/companies" })}>
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
