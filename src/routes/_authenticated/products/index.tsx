import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getProducts } from "@/lib/products.functions";
import { CreateProductDialog } from "@/components/products/create-product-dialog";
import { ProductActions } from "@/components/products/product-actions";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/lib/settings.functions";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoriesManager } from "@/components/products/categories-manager";

export const Route = createFileRoute("/_authenticated/products/")({
  component: ProductsPage,
});

function ProductsPage() {
  const { data } = useSuspenseQuery({
    queryKey: ["products", { page: 1, pageSize: 10 }],
    queryFn: () => getProducts({ data: { page: 1, pageSize: 10 } }),
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(undefined),
  });

  const tenantId = (profile as any)?.user_roles?.[0]?.tenant_id || (profile as any)?.tenant_id;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie seu catálogo de produtos e estoque.
          </p>
        </div>
        {tenantId && <CreateProductDialog tenantId={tenantId} />}
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="products">Catálogo de Produtos</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Catálogo</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.products?.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku || "-"}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price || 0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {product.stock_quantity}
                          {product.stock_quantity <= (product as any).min_stock && (
                            <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                              Baixo
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.active !== false ? "default" : "secondary"} className={product.active !== false ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>
                          {product.active !== false ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <ProductActions product={product} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.products?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum produto cadastrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Categorias</CardTitle>
            </CardHeader>
            <CardContent>
              {tenantId && <CategoriesManager tenantId={tenantId} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
