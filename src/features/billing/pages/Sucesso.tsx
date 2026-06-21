import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const BillingSuccess = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full rounded-3xl bg-card border border-border/60 p-8 shadow-elegant text-center animate-scale-in">
        <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl mb-2">Pagamento confirmado!</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Sua assinatura está sendo ativada. Pode levar alguns segundos para o novo plano
          aparecer no seu painel.
        </p>
        <Button asChild className="bg-gradient-primary w-full">
          <Link to="/configuracoes">Voltar ao painel</Link>
        </Button>
      </div>
    </div>
  );
};

export default BillingSuccess;
