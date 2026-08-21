import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Power, PowerOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { getCategories, createCategory, updateCategory } from "@/lib/products.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";

const categorySchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoriesManagerProps {
  tenantId: string;
}

export function CategoriesManager({ tenantId }: CategoriesManagerProps) {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(undefined),
  });

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
    },
  });

  const editForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
  });

  async function onCreateSubmit(values: CategoryFormValues) {
    try {
      setLoadingId("create");
      await createCategory({
        data: {
          name: values.name,
          tenant_id: tenantId,
        },
      });
      toast.success("Categoria criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsCreateOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar categoria");
    } finally {
      setLoadingId(null);
    }
  }

  async function onEditSubmit(values: CategoryFormValues) {
    if (!editingCategory) return;
    try {
      setLoadingId(editingCategory.id);
      await updateCategory({
        data: {
          id: editingCategory.id,
          updates: { name: values.name },
        },
      });
      toast.success("Categoria atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditingCategory(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar categoria");
    } finally {
      setLoadingId(null);
    }
  }

  async function toggleStatus(id: string, currentStatus: boolean | null | undefined) {
    try {
      setLoadingId(id);
      await updateCategory({
        data: {
          id,
          updates: { active: currentStatus === false },
        },
      });
      toast.success(`Categoria ${currentStatus === false ? "ativada" : "desativada"} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar status");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Gerenciar Categorias</h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Categoria</DialogTitle>
              <DialogDescription>
                Crie uma nova categoria para organizar seus produtos.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Bebidas, Eletrônicos..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={loadingId === "create"}>
                    {loadingId === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Categoria"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : categories?.map((category: any) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>
                  <Badge variant={category.active !== false ? "outline" : "secondary"} className={category.active !== false ? "border-green-500 text-green-700 bg-green-50" : ""}>
                    {category.active !== false ? "Ativa" : "Inativa"}
                  </Badge>

                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingCategory(category);
                        editForm.reset({ name: category.name });
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${category.active !== false ? "text-destructive hover:text-destructive" : "text-green-600 hover:text-green-600"}`}
                      onClick={() => toggleStatus(category.id, category.active)}
                      disabled={loadingId === category.id}
                    >
                      {loadingId === category.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : category.active !== false ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && (categories?.length === 0 || !categories) && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  Nenhuma categoria cadastrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Renomeie sua categoria.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da categoria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={!!loadingId && loadingId === editingCategory?.id}>
                  {!!loadingId && loadingId === editingCategory?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Alterações"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
