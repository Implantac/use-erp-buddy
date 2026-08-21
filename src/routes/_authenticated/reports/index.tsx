import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReportTemplates, getRecentExports, requestReportExport } from "@/lib/reports.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Clock, 
  Filter,
  ArrowRight,
  FileSpreadsheet,
  FileJson
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/reports/")({
  component: ReportsDashboard,
});

function ReportsDashboard() {
  const queryClient = useQueryClient();

  const { data: templates, isLoading: loadingTemplates } = useQuery({
    queryKey: ["report-templates"],
    queryFn: () => getReportTemplates(),
  });

  const { data: recentExports, isLoading: loadingExports } = useQuery({
    queryKey: ["report-exports"],
    queryFn: () => getRecentExports(),
  });

  const exportMutation = useMutation({
    mutationFn: (data: { template_id: string, name: string, format: "csv" | "pdf", filters: any }) => 
      requestReportExport({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-exports"] });
      toast.success("Relatório gerado com sucesso!");
    },
    onError: (err: any) => {
      toast.error("Erro ao gerar relatório: " + err.message);
    }
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sales': return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'finance': return <PieChart className="h-5 w-5 text-blue-500" />;
      case 'logistics': return <BarChart3 className="h-5 w-5 text-purple-500" />;
      case 'hr': return <FileText className="h-5 w-5 text-orange-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios & BI</h1>
          <p className="text-muted-foreground mt-1">
            Gere relatórios detalhados e exporte dados cruciais da sua operação.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loadingTemplates ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-muted/50" />
            </Card>
          ))
        ) : (
          templates?.map((template) => (
            <Card key={template.id} className="group hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                    {getCategoryIcon(template.category)}
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {template.category}
                  </Badge>
                </div>
                <CardTitle className="mt-4">{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => exportMutation.mutate({
                      template_id: template.id,
                      name: template.name,
                      format: "csv",
                      filters: {}
                    })}
                  >
                    <FileSpreadsheet className="h-4 w-4" /> CSV
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => exportMutation.mutate({
                      template_id: template.id,
                      name: template.name,
                      format: "pdf",
                      filters: {}
                    })}
                  >
                    <Download className="h-4 w-4" /> PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Exportações Recentes</CardTitle>
              <CardDescription>Histórico de relatórios gerados por você.</CardDescription>
            </div>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Relatório</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead>Data de Geração</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingExports ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : recentExports?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma exportação encontrada.</TableCell></TableRow>
              ) : (
                recentExports?.map((exportItem) => (
                  <TableRow key={exportItem.id}>
                    <TableCell className="font-medium">{exportItem.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="uppercase text-[10px]">
                        {exportItem.format}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(exportItem.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge className={exportItem.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}>
                        {exportItem.status === 'completed' ? 'Concluído' : 'Processando'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Download className="h-4 w-4" /> Baixar
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