import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getCustomers } from "@/lib/crm.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Edit } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CreateCustomerDialog } from "@/components/crm/create-customer-dialog";
import { getProfile } from "@/lib/settings.functions";


export const Route = createFileRoute("/_authenticated/crm/")({
  component: CRMPage,
});

function CRMPage() {
  const [search, setSearch] = useState("");

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers", search],
    queryFn: () => getCustomers({ data: { search } }),
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
          <h1 className="text-3xl font-bold tracking-tight">Clientes (CRM)</h1>
          <p className="text-muted-foreground">Gestão de relacionamento e base de clientes.</p>
        </div>
        {tenantId && <CreateCustomerDialog tenantId={tenantId} />}
      </div>


      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Base de Clientes</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell>
                </TableRow>
              ) : customers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado.</TableCell>
                </TableRow>
              ) : (
                customers?.map((customer: any) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.document || "-"}</TableCell>
                    <TableCell>{customer.email || "-"}</TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={customer.active ? "default" : "secondary"}>
                        {customer.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
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
