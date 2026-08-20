import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const requirements = [
    { label: "Pelo menos 8 caracteres", met: password.length >= 8 },
    { label: "Uma letra maiúscula", met: /[A-Z]/.test(password) },
    { label: "Uma letra minúscula", met: /[a-z]/.test(password) },
    { label: "Um número", met: /[0-9]/.test(password) },
    { label: "Um caractere especial", met: /[^A-Za-z0-9]/.test(password) },
  ];

  const strength = requirements.filter((req) => req.met).length;
  
  const getStrengthColor = (score: number) => {
    if (score === 0) return "bg-muted";
    if (score <= 2) return "bg-destructive";
    if (score <= 4) return "bg-orange-500";
    return "bg-green-500";
  };

  const getStrengthText = (score: number) => {
    if (score === 0) return "Muito fraca";
    if (score <= 2) return "Fraca";
    if (score <= 4) return "Média";
    if (score === 5) return "Forte";
    return "";
  };

  return (
    <div className="space-y-3 mt-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                step <= strength ? getStrengthColor(strength) : "bg-muted"
              )}
            />
          ))}
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground min-w-[70px] text-right">
          {getStrengthText(strength)}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2">
            {req.met ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground/50" />
            )}
            <span
              className={cn(
                "text-xs transition-colors",
                req.met ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
