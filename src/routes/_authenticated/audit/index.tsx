import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAuditLogs, exportAuditLogsCsv } from "@/lib/audit.functions";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Shield, Info, Download, Filter, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

export const Route = createFileRoute("/_authenticated/audit/")({
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [filters, setFilters] = useState({
    action: "all",
    companyId: "all",
    unitId: "all",
    startDate: "",
    endDate: "",
    entityName: "",
  });

  const debouncedEntityName = useDebounce(filters.entityName, 500);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", { ...filters, entityName: debouncedEntityName, page }],
    queryFn: () => getAuditLogs({ 
      data: { 
        limit: pageSize,
        offset: (page - 1) * pageSize,
        action: filters.action === "all" ? undefined : filters.action,
        companyId: filters.companyId === "all" ? undefined : filters.companyId,
        unitId: filters.unitId === "all" ? undefined : filters.unitId,
        entityName: debouncedEntityName || undefined,
        startDate: filters.startDate ? new Date(filters.startDate).toISOString() : undefined,
        endDate: filters.endDate ? new Date(filters.endDate).toISOString() : undefined,
      } 
    }),
  });

  const logs = data?.logs || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    setPage(1);
  }, [filters.action, filters.companyId, filters.unitId, filters.startDate, filters.endDate, debouncedEntityName]);

  const { data: companies } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("id, name");
      return data;
    }
  });

  const { data: units } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const { data } = await supabase.from("units").select("id, name, company_id");
      return data;
    }
  });

  const exportMutation = useMutation({
    mutationFn: () => exportAuditLogsCsv({ 
      data: { 
        action: filters.action === "all" ? undefined : filters.action,
        companyId: filters.companyId === "all" ? undefined : filters.companyId,
        unitId: filters.unitId === "all" ? undefined : filters.unitId,
        entityName: filters.entityName || undefined,
        startDate: filters.startDate ? new Date(filters.startDate).toISOString() : undefined,
        endDate: filters.endDate ? new Date(filters.endDate).toISOString() : undefined,
      } 
    }),
    onSuccess: (csv) => {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `audit_log_${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Log exportado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao exportar logs.");
    }
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'insert': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Criação</Badge>;
      case 'update': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Edição</Badge>;
      case 'delete': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Exclusão</Badge>;
      case 'approve': return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Aprovação</Badge>;
      case 'transfer': return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">Transferência</Badge>;
      case 'production': return <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20">Produção</Badge>;
      default: return <Badge variant="outline">{action}</Badge>;
    }
  };

  const clearFilters = () => {
    setFilters({
      action: "all",
      companyId: "all",
      unitId: "all",
      startDate: "",
      endDate: "",
      entityName: "",
    });
    setPage(1);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auditoria</h1>
          <p className="text-muted-foreground mt-2">
            Rastreamento completo de todas as ações realizadas no sistema.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <div className="p-3 rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
        </div>
      </div>

      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Filtros</CardTitle>
            </div>
            {(filters.action !== "all" || filters.companyId !== "all" || filters.unitId !== "all" || filters.startDate || filters.endDate || filters.entityName) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
                <X className="h-3 w-3 mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="space-y-2 lg:col-span-1">
              <label className="text-xs font-medium text-muted-foreground uppercase">Busca</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Entidade..."
                  className="pl-9"
                  value={filters.entityName}
                  onChange={(e) => setFilters(prev => ({ ...prev, entityName: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase">Ação</label>
              <Select value={filters.action} onValueChange={(val) => setFilters(prev => ({ ...prev, action: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="insert">Criação</SelectItem>
                  <SelectItem value="update">Edição</SelectItem>
                  <SelectItem value="delete">Exclusão</SelectItem>
                  <SelectItem value="approve">Aprovação</SelectItem>
                  <SelectItem value="transfer">Transferência</SelectItem>
                  <SelectItem value="production">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase">Empresa</label>
              <Select value={filters.companyId} onValueChange={(val) => setFilters(prev => ({ ...prev, companyId: val, unitId: "all" }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {companies?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase">Unidade</label>
              <Select value={filters.unitId} onValueChange={(val) => setFilters(prev => ({ ...prev, unitId: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as unidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as unidades</SelectItem>
                  {units?.filter(u => filters.companyId === "all" || u.company_id === filters.companyId).map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase">Início</label>
              <Input 
                type="date" 
                value={filters.startDate} 
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase">Fim</label>
              <Input 
                type="date" 
                value={filters.endDate} 
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Logs do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8 text-muted-foreground animate-pulse">Carregando logs...</div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[180px]">Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Empresa/Unidade</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <History className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p>Nenhum log encontrado para os filtros selecionados.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs?.map((log: any) => (
                      <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium whitespace-nowrap text-xs">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.profiles?.full_name || 'Sistema'}
                        </TableCell>
                        <TableCell>
                          {getActionBadge(log.action)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{log.entity_name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{log.entity_id?.slice(0, 8)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-xs">
                            <span>{log.companies?.name || '-'}</span>
                            <span className="text-muted-foreground">{log.units?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Ver detalhes JSON">
                            <Info className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 bg-muted/20 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando <span className="font-medium">{logs.length}</span> de <span className="font-medium">{totalCount}</span> registros
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium px-2">
                        Página {page} de {totalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
