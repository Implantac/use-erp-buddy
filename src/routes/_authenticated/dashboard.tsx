import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, LayoutDashboard, History } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao Use Business OS. Gerencie sua operação aqui.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Empresas" 
          value="0" 
          icon={<Building2 className="h-4 w-4" />}
          description="Total de empresas ativas"
        />
        <StatCard 
          title="Usuários" 
          value="0" 
          icon={<Users className="h-4 w-4" />}
          description="Usuários na organização"
        />
        <StatCard 
          title="Unidades" 
          value="0" 
          icon={<LayoutDashboard className="h-4 w-4" />}
          description="Unidades operacionais"
        />
        <StatCard 
          title="Atividades" 
          value="0" 
          icon={<History className="h-4 w-4" />}
          description="Logs de auditoria"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visão Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Conteúdo do dashboard em breve...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, description }: { title: string, value: string, icon: React.ReactNode, description: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
