import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getTransactions, getFinanceSummary, getFinanceChartData } from "@/lib/finance.functions";
import { CreateTransactionDialog } from "@/components/finance/create-transaction-dialog";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/lib/settings.functions";
import { Plus, TrendingUp, TrendingDown, Wallet, Calendar } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from "recharts";

export const Route = createFileRoute("/_authenticated/finance/")({
  component: FinancePage,
});

function FinancePage() {
  const { data: summary } = useSuspenseQuery({
    queryKey: ["finance-summary"],
    queryFn: () => getFinanceSummary(undefined),
  });

  const { data: transactionsData } = useSuspenseQuery({
    queryKey: ["transactions", { page: 1, pageSize: 10 }],
    queryFn: () => getTransactions({ data: { page: 1, pageSize: 10 } }),
  });

  const { data: chartData } = useSuspenseQuery({
    queryKey: ["finance-chart"],
    queryFn: () => getFinanceChartData(),
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(undefined),
  });

  const tenantId = (profile as any)?.user_roles?.[0]?.tenant_id || (profile as any)?.tenant_id;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Controle de fluxo de caixa e transações.
          </p>
        </div>
        <div className="flex gap-2">
          {tenantId && (
            <>
              <CreateTransactionDialog tenantId={tenantId} defaultType="expense" />
              <CreateTransactionDialog tenantId={tenantId} defaultType="income" />
            </>
          )}
        </div>
      </div>



      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Geral</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.balance)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.income)}</div>
          </CardContent>
        </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Fluxo de Caixa Mensal</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Resumo Estratégico</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center h-[300px] space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Margem Operacional</p>
                  <p className="text-xs text-muted-foreground">Eficiência de conversão</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">
                  {summary.income > 0 ? ((summary.balance / summary.income) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Média por Transação</p>
                  <p className="text-xs text-muted-foreground">Ticket médio geral</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">
                  {transactionsData.totalCount > 0 ? formatCurrency(summary.income / transactionsData.totalCount) : 'R$ 0,00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.expense)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionsData.transactions?.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{new Date(tx.date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="font-medium">{tx.description || "Sem descrição"}</TableCell>
                  <TableCell>
                    {tx.type === 'income' ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="h-3 w-3" /> Receita
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600">
                        <TrendingDown className="h-3 w-3" /> Despesa
                      </span>
                    )}
                  </TableCell>
                  <TableCell className={tx.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                    {tx.type === 'income' ? '+' : '-'} {formatCurrency(Number(tx.amount))}
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{tx.status}</span>
                  </TableCell>
                </TableRow>
              ))}
              {transactionsData.transactions?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma transação encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
