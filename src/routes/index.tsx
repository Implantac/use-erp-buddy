import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, LayoutDashboard, Settings, Users, LogIn } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = Route.useNavigate();

  return (

    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Use Business OS</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">Documentação</Button>
            <Button variant="ghost" size="sm">Suporte</Button>
            <Button variant="outline" size="sm" onClick={() => navigate({ to: "/auth" })}>
              <LogIn className="mr-2 h-4 w-4" />
              Entrar
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            O Sistema Operacional para a sua <span className="text-primary">Empresa Moderna</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Uma plataforma robusta, modular e escalável projetada para atender desde o comércio local até complexas operações industriais e logísticas.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-base" onClick={() => navigate({ to: "/dashboard" })}>
              Começar Agora
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base">
              Ver Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-32 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard 
            icon={<LayoutDashboard className="h-6 w-6" />}
            title="Multi-tenant & Multi-empresa"
            description="Gerencie múltiplas unidades, lojas e fábricas em um único ambiente isolado e seguro."
          />
          <FeatureCard 
            icon={<Users className="h-6 w-6" />}
            title="Gestão de Acessos"
            description="Controle granular de permissões e perfis de usuários para cada área do seu negócio."
          />
          <FeatureCard 
            icon={<Settings className="h-6 w-6" />}
            title="Motor de Configuração"
            description="Adapte fluxos, campos e regras de negócio sem comprometer a integridade do sistema."
          />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="mt-20 border-t bg-card py-12">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground">
          <p>© 2026 Use Business OS. Todos os direitos reservados.</p>
          <p className="mt-4">Exibir uma mensagem de erro e um aviso contextual quando eu tentar selecionar uma categoria inativa ao criar ou editar um produto.</p>

        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="transition-all hover:shadow-md border-border bg-card">
      <CardHeader>
        <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <CardTitle className="text-foreground">{title}</CardTitle>
        <CardDescription className="text-muted-foreground">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
