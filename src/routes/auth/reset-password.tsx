import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, KeyRound, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/auth/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = Route.useNavigate();


  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        // Se não houver sessão, o token provavelmente é inválido ou expirou
        if (!data.session) {
          setErrorState("O link de recuperação de senha é inválido ou já expirou. Por favor, solicite um novo link.");
        }
      } catch (err: any) {
        setErrorState(err.message || "Erro ao validar o link de recuperação.");
      } finally {
        setValidating(false);
      }
    };

    checkSession();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Password validation logic
    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!(hasLength && hasUpper && hasLower && hasNumber && hasSpecial)) {
      toast.error("A senha não atende aos requisitos de segurança");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success("Senha redefinida com sucesso!");
      navigate({ to: "/auth" });
    } catch (error: any) {
      toast.error(error.message || "Erro ao redefinir senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="h-7 w-7" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Nova Senha
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Digite sua nova senha de acesso
          </CardDescription>
        </CardHeader>
        <CardContent>
          {validating ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Validando link de recuperação...</p>
            </div>
          ) : errorState ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Link Inválido</AlertTitle>
                <AlertDescription>
                  {errorState}
                </AlertDescription>
              </Alert>
              <Button 
                className="w-full" 
                onClick={() => navigate({ to: "/auth" })}
              >
                Voltar para o Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background border-border"
                />
                <PasswordStrengthMeter password={password} />
                <div className="space-y-1">
                  <Input
                    type="password"
                    placeholder="Confirme a nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={cn(
                      "bg-background border-border",
                      confirmPassword && password !== confirmPassword && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[10px] font-medium text-destructive">As senhas não coincidem</p>
                  )}
                </div>

              </div>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="mr-2 h-4 w-4" />
                )}
                Redefinir Senha
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
