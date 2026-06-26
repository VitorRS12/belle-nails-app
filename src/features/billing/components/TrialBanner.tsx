import { Link } from "react-router-dom";
import { AlertTriangle, Clock } from "lucide-react";
import { useTrialStatus } from "../hooks/useTrialStatus";

export function TrialBanner() {
  const { isTrialing, isTrialExpired, daysLeft, isReadOnly } = useTrialStatus();

  if (isReadOnly) {
    return (
      <div className="w-full bg-destructive/10 border-b border-destructive/30 px-4 py-2 text-center text-xs text-destructive flex items-center justify-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <span>
          Seu período de teste terminou. A conta está em modo somente leitura.{" "}
          <Link to="/planos" className="font-semibold underline">
            Assinar agora
          </Link>
        </span>
      </div>
    );
  }

  if (isTrialing && daysLeft !== null) {
    return (
      <div className="w-full bg-amber-100 border-b border-amber-300 px-4 py-2 text-center text-xs text-amber-900 flex items-center justify-center gap-2">
        <Clock className="h-4 w-4" />
        <span>
          {daysLeft === 0
            ? "Seu teste termina hoje."
            : `Faltam ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"} do seu teste grátis.`}{" "}
          <Link to="/planos" className="font-semibold underline">
            Ver planos
          </Link>
        </span>
      </div>
    );
  }

  return null;
}
