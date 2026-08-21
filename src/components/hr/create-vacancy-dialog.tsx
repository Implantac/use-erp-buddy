import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createJobVacancy } from "@/lib/hr.functions";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const vacancySchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  requirements: z.string().optional(),
  salary_range: z.string().optional(),
});

interface CreateVacancyDialogProps {
  tenantId: string;
}

export function CreateVacancyDialog({ tenantId }: CreateVacancyDialogProps) {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof vacancySchema>>({
    resolver: zodResolver(vacancySchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      salary_range: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof vacancySchema>) =>
      createJobVacancy({
        data: {
          ...values,
          tenant_id: tenantId,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-vacancies"] });
      toast.success("Vaga aberta com sucesso!");
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error("Erro ao abrir vaga: " + error.message);
    },
  });

  function onSubmit(values: z.infer<typeof vacancySchema>) {
    mutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nova Vaga
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Abrir Nova Vaga</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da oportunidade para iniciar o recrutamento.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título da Vaga</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Desenvolvedor Senior" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="salary_range"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Faixa Salarial</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: R$ 8.000 - R$ 12.000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva as responsabilidades da vaga..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requisitos</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: 5 anos de React, Inglês Fluente..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Criando..." : "Abrir Vaga"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
