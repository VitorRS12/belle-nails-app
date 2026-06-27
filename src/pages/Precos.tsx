import { Link } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/usePageMeta";

type Plan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
};

const PLANS: Plan[] = [
  {
    name: "Starter",
    price: "R$ 30",
    period: "/mês",
    description: "Para profissionais autônomos. 30 dias de teste grátis.",
    features: [
      "1 profissional",
      "Agendamentos ilimitados",
      "Página pública de agendamento",
      "Cadastro de clientes e serviços",
    ],
    cta: "Começar 30 dias grátis",
  },
  {
    name: "Pro",
    price: "R$ 49",
    period: "/mês",
    description: "Para pequenos estúdios. 30 dias de teste grátis.",
    features: [
      "Até 5 profissionais",
      "Agendamentos ilimitados",
      "Notificações automáticas por e-mail",
      "Lembretes 24h antes",
      "Relatórios e histórico",
    ],
    highlighted: true,
    cta: "Começar 30 dias grátis",
  },
  {
    name: "Business",
    price: "R$ 99",
    period: "/mês",
    description: "Para estúdios em crescimento. 30 dias de teste grátis.",
    features: [
      "Profissionais ilimitados",
      "Agendamentos ilimitados",
      "Gestão de bloqueios e jornadas",
      "Suporte prioritário",
      "Acesso a recursos avançados",
    ],
    cta: "Começar 30 dias grátis",
  },
];

export default function Precos() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <span className="font-display text-lg">Belle Nails</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight">Planos e preços</h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Todos os planos incluem <strong>30 dias de teste grátis</strong>. Cancele quando quiser durante o período.
          </p>

        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`rounded-3xl border p-7 flex flex-col ${
                p.highlighted
                  ? "border-primary/60 bg-card shadow-elegant scale-[1.02]"
                  : "border-border/60 bg-card/70"
              }`}
            >
              {p.highlighted && (
                <span className="self-start mb-3 text-xs font-medium px-3 py-1 rounded-full bg-gradient-gold text-foreground/80">
                  Mais popular
                </span>
              )}
              <h2 className="font-display text-2xl">{p.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-4xl">{p.price}</span>
                <span className="text-muted-foreground text-sm">{p.period}</span>
              </div>
              <ul className="mt-6 space-y-2.5 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                    <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="mt-7 block">
                <Button
                  className={`w-full h-11 rounded-full ${
                    p.highlighted ? "bg-gradient-primary shadow-elegant" : ""
                  }`}
                  variant={p.highlighted ? "default" : "outline"}
                >
                  {p.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10">
          Pagamentos processados pela Paddle.com (Merchant of Record). Veja nossa{" "}
          <Link to="/reembolso" className="underline">Política de Reembolso</Link> e os{" "}
          <Link to="/termos" className="underline">Termos de Uso</Link>.
        </p>
      </main>

      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Belle Nails
      </footer>
    </div>
  );
}
