import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/lib/dashboard.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin, Users, FolderTree, ArrowUpRight, Wallet, TrendingUp, TrendingDown, ShoppingBag } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { data: stats } = useSuspenseQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => getDashboardStats(),
  });

  const cards = [
    {
      title: "Empresas",
      value: stats.companies.toString(),
      description: "Empresas ativas no sistema",
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-600/10",
    },
    {
      title: "Unidades",
      value: stats.units.toString(),
      description: "Unidades operacionais",
      icon: MapPin,
      color: "text-green-600",
      bgColor: "bg-green-600/10",
    },
    {
      title: "Grupos",
      value: stats.groups.toString(),
      description: "Segmentação organizacional",
      icon: FolderTree,
      color: "text-purple-600",
      bgColor: "bg-purple-600/10",
    },
    {
      title: "Equipe",
      value: stats.team.toString(),
      description: "Membros com acesso",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-600/10",
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da sua organização e operações.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} className="relative overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio (Vendas)</CardTitle>
            <ShoppingBag className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.sales.avgTicket)}</div>
            <p className="text-xs text-muted-foreground mt-1">Média por venda realizada</p>
          </CardContent>
        </Card>
        <Card className={stats.stockAlerts > 0 ? "bg-red-50 border-red-200" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas de Estoque</CardTitle>
            <ArrowUpRight className={`h-4 w-4 ${stats.stockAlerts > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.stockAlerts > 0 ? 'text-red-600' : ''}`}>
              {stats.stockAlerts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Produtos abaixo do mínimo</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Financeiro</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.finance.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.finance.balance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Consolidado do tenant</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.finance.income)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.finance.expense)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground border-2 border-dashed rounded-lg">
              <ArrowUpRight className="h-8 w-8 mb-2 opacity-20" />
              <p>Nenhuma atividade registrada hoje.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.stockAlerts > 0 && (
              <div className="flex items-start gap-4 p-3 border rounded-lg bg-red-50 border-red-100 animate-pulse">
                <div className="h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">!</div>
                <div>
                  <p className="text-sm font-medium text-red-900">Atenção ao Estoque</p>
                  <p className="text-xs text-red-700">{stats.stockAlerts} produtos precisam de reposição imediata.</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-4 p-3 border rounded-lg bg-primary/5 border-primary/10">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
              <div>
                <p className="text-sm font-medium">Complete seu perfil</p>
                <p className="text-xs text-muted-foreground">Adicione seu nome e avatar nas configurações.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-3 border rounded-lg opacity-60">
              <div className="h-6 w-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold">2</div>
              <div>
                <p className="text-sm font-medium">Cadastre uma unidade</p>
                <p className="text-xs text-muted-foreground">Defina o local de operação da sua empresa.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
