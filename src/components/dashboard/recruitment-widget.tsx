import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BriefcaseBusiness, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface RecruitmentWidgetProps {
  vacancies: number;
  candidates: number;
}

export function RecruitmentWidget({ vacancies, candidates }: RecruitmentWidgetProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">RH & Recrutamento</CardTitle>
        <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-2xl font-bold">{vacancies}</p>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Vagas Abertas</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{candidates}</p>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Candidatos</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border mt-2">
            <Button variant="ghost" size="sm" className="w-full justify-between" asChild>
              <Link to="/hr">
                Gerenciar Recrutamento
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
