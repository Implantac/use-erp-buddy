import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Target } from "lucide-react";

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createOpportunity, getCustomers } from "@/lib/crm.functions";
import { getMyCompanies } from "@/lib/companies.functions";
import { getTeamMembers } from "@/lib/team.functions";

const opportunitySchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  description: z.string().optional().nullable(),
  customer_id: z.string().uuid("Selecione um cliente"),
  company_id: z.string().uuid("Selecione uma empresa"),
  value: z.coerce.number().min(0, "O valor não pode ser negativo"),
  stage: z.enum(['lead', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
  probability: z.coerce.number().min(0).max(100),
  expected_closing_date: z.string().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
});

type OpportunityFormValues = z.infer<typeof opportunitySchema>;

export function CreateOpportunityDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: () => getCustomers({ data: {} }),
  });

  const { data: companies } = useQuery({
    queryKey: ["my-companies"],
    queryFn: () => getMyCompanies(undefined),
  });

  const { data: teamMembers } = useQuery({
    queryKey: ["team-members"],
    queryFn: () => getTeamMembers(undefined),
  });

  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      title: "",
      description: "",
      customer_id: "",
      company_id: "",
      value: 0,
      stage: "lead",
      probability: 10,
      expected_closing_date: "",
      assigned_to: "",
    },
  });

  async function onSubmit(values: OpportunityFormValues) {
    try {
      setLoading(true);
      await createOpportunity({
        data: {
          ...values,
          tenant_id: tenantId,
          description: values.description || null,
          expected_closing_date: values.expected_closing_date || null,
          assigned_to: values.assigned_to === "" ? null : values.assigned_to,
        },
      });
      toast.success("Oportunidade criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["crm-opportunities"] });
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar oportunidade");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          Nova Oportunidade
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Oportunidade</DialogTitle>
          <DialogDescription>
            Cadastre uma nova oportunidade de negócio no seu funil de vendas.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título da Oportunidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Venda de Licenças ERP" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(customers as any[])?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa (Unidade de Negócio)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a empresa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(companies as any[])?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Estimado (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estágio</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="qualification">Qualificação</SelectItem>
                        <SelectItem value="proposal">Proposta</SelectItem>
                        <SelectItem value="negotiation">Negociação</SelectItem>
                        <SelectItem value="closed_won">Ganhamos</SelectItem>
                        <SelectItem value="closed_lost">Perdemos</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="probability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Probabilidade (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expected_closing_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Prevista de Fechamento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(teamMembers as any[])?.map((m) => (
                          <SelectItem key={m.user_id} value={m.user_id}>{m.profiles?.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações / Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes da negociação..." {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Criando..." : "Criar Oportunidade"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
