import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeamMembers, removeTeamMember } from "@/lib/team.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Shield, MoreHorizontal, UserMinus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/team/")({
  component: TeamList,
});

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  manager: "Gerente",
  user: "Usuário",
  viewer: "Visualizador",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  manager: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  user: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  viewer: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
};

function TeamList() {
  const queryClient = useQueryClient();
  const { data: members } = useSuspenseQuery({
    queryKey: ["team-members"],
    queryFn: () => getTeamMembers(),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeTeamMember({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Membro removido com sucesso.");
    },
    onError: (error: any) => {
      toast.error("Erro ao remover membro: " + (error.message || "Tente novamente."));
    }
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
          <p className="text-muted-foreground">
            Gerencie os membros e as permissões de acesso da sua organização.
          </p>
        </div>
        <Button onClick={() => toast.info("Funcionalidade de convite em breve!")}>
          <UserPlus className="mr-2 h-4 w-4" />
          Convidar Membro
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros da Organização</CardTitle>
          <CardDescription>
            Total de {members?.length || 0} usuários ativos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((member: any) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.profiles?.avatar_url} />
                        <AvatarFallback>
                          {member.profiles?.full_name?.substring(0, 2).toUpperCase() || "US"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.profiles?.full_name || "Usuário sem nome"}</div>
                        <div className="text-xs text-muted-foreground">{member.user_id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={ROLE_COLORS[member.role]}>
                      <Shield className="mr-1 h-3 w-3" />
                      {ROLE_LABELS[member.role] || member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              onSelect={(e) => e.preventDefault()}
                              className="text-destructive"
                            >
                              <UserMinus className="mr-2 h-4 w-4" />
                              Remover Acesso
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revogar acesso?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Isso removerá todas as permissões do usuário nesta organização.
                                Ele não poderá mais acessar o painel ou os dados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => removeMutation.mutate(member.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Confirmar Remoção
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
