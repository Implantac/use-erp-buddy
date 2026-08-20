import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGroup } from "@/lib/groups.functions";
import { getMyTenants } from "@/lib/tenants.functions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useSuspenseQuery } from "@tanstack/react-query";

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  const { data: tenants } = useSuspenseQuery({
    queryKey: ["tenants"],
    queryFn: () => getMyTenants(),
  });

  const mutation = useMutation({
    mutationFn: (vars: { name: string; tenant_id: string }) => createGroup({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Grupo criado com sucesso.");
      setOpen(false);
      setName("");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar grupo: " + (error.message || "Tente novamente."));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("O nome do grupo é obrigatório.");
      return;
    }
    const tenantId = tenants?.[0]?.id;
    if (!tenantId) {
      toast.error("Nenhum tenant encontrado.");
      return;
    }

    mutation.mutate({ name, tenant_id: tenantId });
  };



  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Grupo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar Novo Grupo</DialogTitle>
            <DialogDescription>
              Adicione um novo grupo organizacional para organizar suas empresas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Grupo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Regional Sul, Holding, Varejo..."
                disabled={mutation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Criando..." : "Criar Grupo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
