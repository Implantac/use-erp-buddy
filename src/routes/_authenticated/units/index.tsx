import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getMyUnits } from "@/lib/units.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, MapPin, MoreHorizontal, Pencil, PowerOff } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated/units/")({
  component: UnitsList,
});

function UnitsList() {
  const navigate = useNavigate();
  const { data: units } = useSuspenseQuery({
    queryKey: ["units"],
    queryFn: () => getMyUnits(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Unidades</h1>
          <p className="text-muted-foreground">
            Gerencie as unidades físicas e filiais da sua organização.
          </p>
        </div>
        <Button onClick={() => navigate({ to: "/units/new" })}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Unidade
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listagem</CardTitle>
          <CardDescription>
            Total de {units.length} unidades encontradas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {unit.name}
                    </div>
                  </TableCell>
                  <TableCell>{unit.companies?.name || "-"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link to="/units/$unitId" params={{ unitId: unit.id }} className="flex w-full items-center">
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <PowerOff className="mr-2 h-4 w-4" />
                          Desativar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {units.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Nenhuma unidade cadastrada.
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
