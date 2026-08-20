import { useState } from "react";
import { MoreHorizontal, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { EditProductDialog } from "./edit-product-dialog";
import { updateProduct } from "@/lib/products.functions";

interface ProductActionsProps {
  product: {
    id: string;
    name: string;
    sku: string | null;
    price: number | null;
    stock_quantity: number | null;
    category_id: string | null;
    description: string | null;
    active: boolean | null;
  };
}

export function ProductActions({ product }: ProductActionsProps) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const toggleStatus = async () => {
    try {
      setLoading(true);
      await updateProduct({
        data: {
          id: product.id,
          updates: {
            active: !product.active,
          },
        },
      });
      toast.success(`Produto ${product.active ? "desativado" : "ativado"} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <EditProductDialog product={product} />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Ações</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={toggleStatus} 
            disabled={loading}
            className={product.active ? "text-destructive" : "text-green-600"}
          >
            {product.active ? (
              <>
                <PowerOff className="mr-2 h-4 w-4" />
                Desativar
              </>
            ) : (
              <>
                <Power className="mr-2 h-4 w-4" />
                Ativar
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
