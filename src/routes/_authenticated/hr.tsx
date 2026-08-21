import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEmployees, getPayrollRecords, getDepartments, getJobPositions } from "@/lib/hr.functions";
import { getProfile } from "@/lib/settings.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users2, Briefcase, FileText, Plus, UserCheck, UserX, Clock, DollarSign, Building, Search, Filter, BriefcaseBusiness, MapPin } from "lucide-react";
import { CreateVacancyDialog } from "@/components/hr/create-vacancy-dialog";
import { getJobVacancies } from "@/lib/hr.functions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { z } from "zod";

const hrSearchSchema = z.object({
  tab: z.enum(['employees', 'payroll', 'positions', 'recruitment']).catch('employees'),
});

export const Route = createFileRoute("/_authenticated/hr")({
  validateSearch: hrSearchSchema,
  component: HRPage,
});

function HRPage() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
  });

  const tenantId = ((profile as any)?.user_roles?.[0]?.tenant_id || (profile as any)?.tenant_id || "") as string;

  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => getEmployees() as Promise<any[]>,
  });

  const { data: payroll, isLoading: loadingPayroll } = useQuery({
    queryKey: ["payroll-records"],
    queryFn: () => getPayrollRecords() as Promise<any[]>,
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => getDepartments() as Promise<any[]>,
  });

  const { data: positions } = useQuery({
    queryKey: ["job-positions"],
    queryFn: () => getJobPositions() as Promise<any[]>,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 gap-1"><UserCheck className="h-3 w-3" /> Ativo</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 gap-1"><Clock className="h-3 w-3" /> Afastado</Badge>;
      case 'terminated':
        return <Badge variant="destructive" className="gap-1"><UserX className="h-3 w-3" /> Desligado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recursos Humanos</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de colaboradores, cargos, salários e folha de pagamento.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Novo Colaborador
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Colaboradores</CardTitle>
            <Users2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees?.filter(e => e.status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Departamentos</CardTitle>
            <Building className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Folha (Mês)</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(employees?.reduce((acc, curr) => acc + (curr.salary || 0), 0) || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs 
        value={tab} 
        onValueChange={(v) => navigate({ search: { tab: v as any } })} 
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="employees" className="gap-2">
            <Users2 className="h-4 w-4" /> Colaboradores
          </TabsTrigger>
          <TabsTrigger value="payroll" className="gap-2">
            <FileText className="h-4 w-4" /> Folha de Pagamento
          </TabsTrigger>
          <TabsTrigger value="positions" className="gap-2">
            <Briefcase className="h-4 w-4" /> Cargos & Estrutura
          </TabsTrigger>
          <TabsTrigger value="recruitment" className="gap-2">
            <BriefcaseBusiness className="h-4 w-4" /> Recrutamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Listagem de Colaboradores</CardTitle>
              <CardDescription>Gerencie as informações profissionais da sua equipe.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cargo / Depto</TableHead>
                    <TableHead>Admissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Salário</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingEmployees ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow>
                  ) : employees?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum colaborador encontrado.</TableCell></TableRow>
                  ) : (
                    employees?.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{emp.full_name}</span>
                            <span className="text-[10px] text-muted-foreground">{emp.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{(emp.job_positions as any)?.title || 'Sem cargo'}</span>
                            <span className="text-[10px] text-muted-foreground">{(emp.departments as any)?.name || 'Sem departamento'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(emp.hire_date), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{getStatusBadge(emp.status)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(emp.salary)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle>Registros de Folha</CardTitle>
              <CardDescription>Histórico de pagamentos e lançamentos mensais.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Base</TableHead>
                    <TableHead className="text-right">Líquido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPayroll ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow>
                  ) : payroll?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum registro de folha encontrado.</TableCell></TableRow>
                  ) : (
                    payroll?.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.period_month}/{record.period_year}
                        </TableCell>
                        <TableCell>{(record.employees as any)?.full_name}</TableCell>
                        <TableCell>
                          <Badge variant={record.status === 'paid' ? 'default' : 'secondary'}>
                            {record.status === 'paid' ? 'Pago' : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(record.base_salary)}</TableCell>
                        <TableCell className="text-right font-bold text-primary">{formatCurrency(record.net_salary)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Departamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departments?.map((dept) => (
                    <div key={dept.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{dept.name}</p>
                        <p className="text-xs text-muted-foreground">{dept.description || 'Sem descrição'}</p>
                      </div>
                      <Badge variant="outline">{employees?.filter(e => e.department_id === dept.id).length || 0} Colabs</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Cargos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {positions?.map((pos) => (
                    <div key={pos.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{pos.title}</p>
                        <p className="text-xs text-muted-foreground">{(pos.departments as any)?.name}</p>
                      </div>
                      <p className="text-sm font-semibold">{formatCurrency(pos.base_salary)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="recruitment">
          <Card>
            <CardHeader>
              <CardTitle>Processos Seletivos</CardTitle>
              <CardDescription>Acompanhe e gerencie as vagas abertas e candidatos.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 rounded-full bg-primary/10">
                <BriefcaseBusiness className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Módulo de Recrutamento</h3>
                <p className="text-muted-foreground max-w-sm">
                  Em breve você poderá gerenciar vagas, currículos e entrevistas diretamente por aqui.
                </p>
              </div>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> Criar Primeira Vaga
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
