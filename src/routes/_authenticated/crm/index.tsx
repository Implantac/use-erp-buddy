import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOpportunities, updateOpportunityStage } from "@/lib/crm.functions";
import { getProfile } from "@/lib/settings.functions";
import { CreateOpportunityDialog } from "@/components/crm/create-opportunity-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const STAGES = [
  { id: 'lead', label: 'Lead', color: 'bg-slate-500' },
  { id: 'qualification', label: 'Qualificação', color: 'bg-blue-500' },
  { id: 'proposal', label: 'Proposta', color: 'bg-indigo-500' },
  { id: 'negotiation', label: 'Negociação', color: 'bg-purple-500' },
  { id: 'closed_won', label: 'Ganhamos', color: 'bg-green-600' },
  { id: 'closed_lost', label: 'Perdemos', color: 'bg-red-600' },
];

export const Route = createFileRoute("/_authenticated/crm/")({
  component: PipelinePage,
});

function PipelinePage() {
  const queryClient = useQueryClient();
  const { data: opportunities, isLoading } = useQuery({
    queryKey: ["crm-opportunities"],
    queryFn: () => getOpportunities(undefined),
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(undefined),
  });

  const updateStageMutation = useMutation({
    mutationFn: updateOpportunityStage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-opportunities"] });
      toast.success("Estágio atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar estágio");
    }
  });

  const tenantId = (profile as any)?.user_roles?.[0]?.tenant_id || (profile as any)?.tenant_id;

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    updateStageMutation.mutate({
      data: {
        id: draggableId,
        stage: destination.droppableId,
        tenant_id: tenantId
      }
    });
  };

  const opportunitiesByStage = (opportunities as any[] || []).reduce((acc: any, opp: any) => {
    if (!acc[opp.stage]) acc[opp.stage] = [];
    acc[opp.stage].push(opp);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Funil de Vendas</h1>
          <p className="text-muted-foreground">Gestão de oportunidades e pipeline comercial.</p>
        </div>
        {tenantId && <CreateOpportunityDialog tenantId={tenantId} />}
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 h-full min-w-max">
            {STAGES.map((stage) => (
              <div key={stage.id} className="w-80 flex flex-col bg-muted/30 rounded-lg border border-border">
                <div className="p-3 border-b border-border flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                    <h3 className="font-semibold text-sm">{stage.label}</h3>
                  </div>
                  <Badge variant="secondary">
                    {opportunitiesByStage[stage.id]?.length || 0}
                  </Badge>
                </div>

                <Droppable droppableId={stage.id}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="p-2 flex-1 overflow-y-auto space-y-2"
                    >
                      {opportunitiesByStage[stage.id]?.map((opp: any, index: number) => (
                        <Draggable key={opp.id} draggableId={opp.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <Card className="hover:shadow-sm transition-shadow">
                                <CardHeader className="p-3">
                                  <CardTitle className="text-sm font-medium leading-none mb-1">
                                    {opp.title}
                                  </CardTitle>
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {opp.customers?.name}
                                  </p>
                                </CardHeader>
                                <CardContent className="p-3 pt-0">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold">
                                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opp.value || 0)}
                                    </span>
                                    <Badge variant="outline" className="text-[10px] px-1 h-4">
                                      {opp.probability}%
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
