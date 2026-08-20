import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyUnits, toggleUnitStatus } from "@/lib/units.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, MapPin, MoreHorizontal, Pencil, Power, Search as SearchIcon, Filter, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { CreateUnitDialog } from "@/components/units/create-unit-dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { z } from "zod";

const unitsSearchSchema = z.object({
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).optional(),
  search: z.string().optional(),
  status: z.enum(["all", "active", "inactive"]).optional(),
  orderBy: z.string().optional(),
  orderDirection: z.enum(["asc", "desc"]).optional(),
});

export const Route = createFileRoute("/_authenticated/units/")({
  validateSearch: (search) => unitsSearchSchema.parse(search),
  component: UnitsList,
});

function UnitsList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate({ from: Route.fullPath });
  const { page, pageSize, search, status, orderBy, orderDirection } = Route.useSearch();
  const [searchTerm, setSearchTerm] = useState(search || "");

  // Sync searchTerm with search param when it changes externally
  useEffect(() => {
    setSearchTerm(search || "");
  }, [search]);

  // Debounce search update to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== search) {
        navigate({
          search: (prev) => ({ ...prev, search: searchTerm, page: 1 }),
          replace: true,
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, search, navigate]);

  const { data } = useSuspenseQuery({
    queryKey: ["units", page, pageSize, orderBy, orderDirection, search, status],
    queryFn: () => getMyUnits({ 
      data: { 
        page, 
        pageSize, 
        orderBy, 
        orderDirection,
        search: search || undefined,
        isActive: status === "all" ? null : status === "active"
      } 
    }),
  });

  const units = data?.units || [];
  const totalCount = data?.count || 0;
  const currentPageSize = pageSize || 10;
  const currentPage = page || 1;
  const totalPages = Math.ceil(totalCount / currentPageSize);

  const toggleMutation = useMutation({
    mutationFn: (vars: { id: string; is_active: boolean }) => toggleUnitStatus({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success("Status da unidade atualizado.");
    },
    onError: () => {
      toast.error("Erro ao atualizar status.");
    }
  });

  const filteredUnits = units;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Unidades</h1>
          <p className="text-muted-foreground">
            Gerencie as unidades físicas e filiais da sua organização.
          </p>
        </div>
        <CreateUnitDialog />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou empresa..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select 
            value={status || "all"} 
            onValueChange={(value: any) => navigate({ search: (prev) => ({ ...prev, status: value, page: 1 }) })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="inactive">Inativas</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Itens por página:</span>
            <Select 
              value={(pageSize || 10).toString()} 
              onValueChange={(value) => {
                navigate({ search: (prev) => ({ ...prev, pageSize: Number(value), page: 1 }) });
              }}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listagem</CardTitle>
          <CardDescription>
            Exibindo {filteredUnits.length} unidades nesta página (Total: {totalCount}).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      if (orderBy === "name") {
                        navigate({ search: (prev) => ({ ...prev, orderDirection: orderDirection === "asc" ? "desc" : "asc" }) });
                      } else {
                        navigate({ search: (prev) => ({ ...prev, orderBy: "name", orderDirection: "asc" }) });
                      }
                    }}
                    className="-ml-4 h-8 data-[state=open]:bg-accent"
                  >
                    <span>Nome</span>
                    {orderBy === "name" ? (
                      orderDirection === "asc" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                    ) : (
                      <ChevronsUpDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      if (orderBy === "is_active") {
                        navigate({ search: (prev) => ({ ...prev, orderDirection: orderDirection === "asc" ? "desc" : "asc" }) });
                      } else {
                        navigate({ search: (prev) => ({ ...prev, orderBy: "is_active", orderDirection: "asc" }) });
                      }
                    }}
                    className="-ml-4 h-8 data-[state=open]:bg-accent"
                  >
                    <span>Status</span>
                    {orderBy === "is_active" ? (
                      orderDirection === "asc" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                    ) : (
                      <ChevronsUpDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnits.map((unit: any) => (
                <TableRow key={unit.id} className={!unit.is_active ? "opacity-60" : ""}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {unit.name}
                    </div>
                  </TableCell>
                  <TableCell>{unit.companies?.name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={unit.is_active ? "default" : "secondary"}>
                      {unit.is_active ? "Ativa" : "Inativa"}
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
                        <DropdownMenuItem asChild>
                          <Link to="/units/$unitId" params={{ unitId: unit.id }} className="flex w-full items-center">
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => toggleMutation.mutate({ id: unit.id, is_active: !unit.is_active })}
                          className={unit.is_active ? "text-destructive" : "text-primary"}
                        >
                          <Power className="mr-2 h-4 w-4" />
                          {unit.is_active ? "Desativar" : "Ativar"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUnits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Nenhuma unidade encontrada nesta página.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => navigate({ search: (prev) => ({ ...prev, page: Math.max(1, currentPage - 1) }) })}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    // Show current page, first, last, and one around current
                    if (
                      pageNum === 1 || 
                      pageNum === totalPages || 
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink 
                            isActive={currentPage === pageNum}
                            onClick={() => navigate({ search: (prev) => ({ ...prev, page: pageNum }) })}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => navigate({ search: (prev) => ({ ...prev, page: Math.min(totalPages, currentPage + 1) }) })}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
