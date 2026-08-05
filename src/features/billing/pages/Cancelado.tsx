import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const BillingCanceled = () => {
  const { t } = useTranslation("billing");
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full rounded-3xl bg-card border border-border/60 p-8 shadow-elegant text-center animate-scale-in">
        <div className="mx-auto h-16 w-16 rounded-full bg-muted text-muted-foreground inline-flex items-center justify-center mb-4">
          <XCircle className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl mb-2">{t("canceled.title")}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {t("canceled.description")}
        </p>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="flex-1">
            <Link to="/configuracoes">{t("canceled.back")}</Link>
          </Button>
          <Button asChild className="flex-1 bg-gradient-primary">
            <Link to="/planos">{t("canceled.viewPlans")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BillingCanceled;
