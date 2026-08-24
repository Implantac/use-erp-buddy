import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Factory, Play, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";

interface ProductionWidgetProps {
  stats: {
    planned: number;
    in_production: number;
    completed: number;
    cancelled: number;
  };
}

export function ProductionWidget({ stats }: ProductionWidgetProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">Produção Industrial</CardTitle>
        <Factory className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-md bg-blue-50 border border-blue-100">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-bold text-blue-900">{stats.planned}</p>
                <p className="text-[10px] text-blue-700 uppercase">Planejadas</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-md bg-orange-50 border border-orange-100">
              <Play className="h-4 w-4 text-orange-600 animate-pulse" />
              <div>
                <p className="text-sm font-bold text-orange-900">{stats.in_production}</p>
                <p className="text-[10px] text-orange-700 uppercase">Em Produção</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              {stats.completed} concluídas
            </span>
            <Badge variant="outline" className="text-[10px] uppercase font-normal">
              Últimos 30 dias
            </Badge>
          </div>

          <div className="pt-2 border-t border-border mt-2">
            <Button variant="ghost" size="sm" className="w-full justify-between" asChild>
              <Link to="/production" disabled className="w-full flex justify-between items-center">
                Ordens de Produção
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
