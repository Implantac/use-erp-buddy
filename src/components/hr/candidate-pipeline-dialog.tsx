import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCandidates, createCandidate, updateCandidateStatus } from "@/lib/hr.functions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STAGES = [
  { value: "applied", label: "Inscrito" },
  { value: "screening", label: "Triagem" },
  { value: "interview", label: "Entrevista" },
  { value: "offer", label: "Proposta" },
  { value: "hired", label: "Contratado" },
  { value: "rejected", label: "Reprovado" },
] as const;

type Stage = (typeof STAGES)[number]["value"];

export function CandidatePipelineDialog({
  vacancyId,
  vacancyTitle,
  trigger,
}: {
  vacancyId: string;
  vacancyTitle: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const queryClient = useQueryClient();

  const { data: candidates, isLoading } = useQuery({
    queryKey: ["candidates", vacancyId],
    queryFn: () => getCandidates({ data: { vacancyId } }) as Promise<any[]>,
    enabled: open,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["candidates"] });
    queryClient.invalidateQueries({ queryKey: ["candidates-all"] });
  };

  const addMutation = useMutation({
    mutationFn: () =>
      createCandidate({
        data: {
          vacancy_id: vacancyId,
          full_name: fullName,
          email: email || null,
          phone: phone || null,
        },
      }),
    onSuccess: () => {
      setFullName("");
      setEmail("");
      setPhone("");
      invalidate();
      toast.success("Candidato cadastrado.");
    },
    onError: (err: any) => toast.error("Erro ao cadastrar: " + err.message),
  });

  const stageMutation = useMutation({
    mutationFn: (vars: { id: string; status: Stage }) => updateCandidateStatus({ data: vars }),
    onSuccess: () => {
      invalidate();
      toast.success("Etapa atualizada.");
    },
    onError: (err: any) => toast.error("Erro ao atualizar: " + err.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users2 className="h-4 w-4" /> Candidatos — {vacancyTitle}
          </DialogTitle>
          <DialogDescription>Cadastre candidatos e avance cada um pelas etapas do processo.</DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-3 sm:grid-cols-4 items-end border rounded-lg p-4 bg-muted/30"
          onSubmit={(e) => {
            e.preventDefault();
            if (fullName.trim().length < 3) {
              toast.error("Informe o nome completo do candidato.");
              return;
            }
            addMutation.mutate();
          }}
        >
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cand-name">Nome</Label>
            <Input id="cand-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome completo" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cand-email">E-mail</Label>
            <Input id="cand-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="opcional" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cand-phone">Telefone</Label>
            <Input id="cand-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="opcional" />
          </div>
          <Button type="submit" className="gap-2 sm:col-span-4" disabled={addMutation.isPending}>
            {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar candidato
          </Button>
        </form>

        <div className="max-h-[320px] overflow-auto space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Carregando candidatos...</p>
          ) : !candidates?.length ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhum candidato inscrito nesta vaga.</p>
          ) : (
            candidates.map((candidate) => (
              <div key={candidate.id} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{candidate.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {candidate.email || "sem e-mail"} {candidate.phone ? `• ${candidate.phone}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="hidden sm:inline-flex">
                    {STAGES.find((s) => s.value === candidate.status)?.label ?? candidate.status}
                  </Badge>
                  <Select
                    value={candidate.status}
                    onValueChange={(value) => stageMutation.mutate({ id: candidate.id, status: value as Stage })}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
