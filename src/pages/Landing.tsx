import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  CalendarDays,
  Users,
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
  ArrowRight,
  Eye,
  Check,
} from "lucide-react";
import dashboardShot from "@/assets/screenshots/painel.png.asset.json";
import agendaShot from "@/assets/screenshots/agenda.png.asset.json";
import clientesShot from "@/assets/screenshots/clientes.png.asset.json";

const plans = [
  {
    name: "Starter",
    price: "R$ 30",
    period: "/mês",
    description: "Para profissionais autônomos.",
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
    description: "Para pequenos estúdios.",
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
    description: "Para estúdios em crescimento.",
    features: [
      "Profissionais ilimitados",
      "Agendamentos ilimitados",
      "Gestão de bloqueios e jornadas",
      "Suporte prioritário",
      "Recursos avançados",
    ],
    cta: "Começar 30 dias grátis",
  },
];

const screens = [
  {
    src: dashboardShot.url,
    alt: "Painel do Belle Nails com resumo do salão",
    label: "Painel",
  },
  {
    src: agendaShot.url,
    alt: "Agenda semanal do Belle Nails com atendimentos",
    label: "Agenda",
  },
  {
    src: clientesShot.url,
    alt: "Lista de clientes do Belle Nails",
    label: "Clientes",
  },
];

const features = [
  {
    icon: CalendarDays,
    title: "Agendamento inteligente",
    desc: "Sua cliente agenda online em poucos toques e recebe a confirmação por e-mail automaticamente.",
  },
  {
    icon: Users,
    title: "Gestão de profissionais",
    desc: "Cada profissional controla a própria agenda e recebe as solicitações de atendimento em tempo real.",
  },
  {
    icon: ClipboardList,
    title: "Agenda personalizável",
    desc: "Defina o intervalo dos horários — 10, 15, 30, 60 minutos ou o tempo que fizer sentido para você.",
  },
  {
    icon: LayoutDashboard,
    title: "Comunicação automatizada",
    desc: "E-mails automáticos para a cliente, para a profissional e para a proprietária a cada novo agendamento.",
  },
  {
    icon: ShieldCheck,
    title: "Dados protegidos",
    desc: "Cada profissional só acessa as próprias clientes, com criptografia e segurança de ponta.",
  },
  {
    icon: Sparkles,
    title: "Pensado para o seu segmento",
    desc: "Feito sob medida para manicure, design de cílios e sobrancelhas — sem configurações que você não precisa.",
  },
];

const Landing = () => {
  const { session, loading } = useAuth();

  usePageMeta({
    title: "Belle Nails · A agenda elegante do seu salão",
    description:
      "Belle Nails — agenda online e gestão completa para manicures, designers de cílios e sobrancelhas. Página pública de agendamento, notificações automáticas e relatórios.",
    path: "/",
  });

  if (!loading && session) return <Navigate to="/inicio" replace />;

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Top bar */}
      <header className="max-w-6xl mx-auto px-6 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary shadow-elegant flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg tracking-wide">Belle Nails</span>
        </div>
        <Link to="/auth">
          <Button variant="ghost" className="rounded-full">
            Entrar
          </Button>
        </Link>
      </header>

      <main id="main">


      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 backdrop-blur px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-6 animate-fade-in">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Para profissionais de beleza
        </div>
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl leading-[1.05] tracking-tight animate-fade-in">
          A agenda <em className="italic text-primary">elegante</em>
          <br />
          do seu salão.
        </h1>
        <p className="mt-6 max-w-xl mx-auto text-base sm:text-lg text-muted-foreground animate-fade-in">
          Receba clientes, organize horários e acompanhe seu negócio com um app
          feito sob medida para quem cuida da beleza.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in">
          <Link to="/auth">
            <Button
              size="lg"
              className="h-12 px-7 rounded-full bg-gradient-primary shadow-elegant gap-2"
            >
              Começar agora <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <a href="#recursos">
            <Button size="lg" variant="ghost" className="h-12 px-6 rounded-full">
              Ver recursos
            </Button>
          </a>
        </div>

        {/* Decorative divider */}
        <div className="mt-20 flex items-center justify-center gap-4 text-accent/70">
          <span className="h-px w-16 bg-accent/40" />
          <Sparkles className="h-4 w-4" />
          <span className="h-px w-16 bg-accent/40" />
        </div>
      </section>

      {/* Screenshots */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 backdrop-blur px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
            <Eye className="h-3 w-3" />
            Veja por dentro
          </div>
          <h2 className="font-display text-3xl sm:text-4xl tracking-tight">
            Conheça o app.
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Interface elegante e intuitiva pensada para o dia a dia do salão.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {screens.map(({ src, alt, label }) => (
            <div key={label} className="group text-center">
              <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden shadow-soft hover:shadow-elegant transition-smooth">
                <img
                  src={src}
                  alt={alt}
                  loading="lazy"
                  className="w-full h-auto object-contain group-hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <p className="mt-3 text-sm font-medium text-muted-foreground tracking-wide uppercase">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-14">
          <p className="text-[11px] uppercase tracking-[0.25em] text-accent-foreground/80 mb-3">
            Recursos
          </p>
          <h2 className="font-display text-3xl sm:text-4xl tracking-tight">
            Tudo o que seu salão precisa.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <article
              key={title}
              className="group rounded-3xl border border-border/60 bg-card/80 backdrop-blur p-6 shadow-soft hover:shadow-elegant transition-smooth"
            >
              <div className="h-11 w-11 rounded-2xl bg-gradient-gold shadow-gold flex items-center justify-center mb-5">
                <Icon className="h-5 w-5 text-foreground/80" />
              </div>
              <h3 className="font-display text-xl mb-1.5">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {desc}
              </p>
            </article>
          ))}
        </div>

        {/* Final CTA */}
        <div className="mt-20 rounded-[2rem] border border-border/60 bg-card/70 backdrop-blur px-8 py-14 text-center shadow-soft">
          <h3 className="font-display text-3xl sm:text-4xl tracking-tight">
            Pronta para encantar suas clientes?
          </h3>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            Crie sua conta gratuitamente e comece a organizar sua agenda em minutos.
          </p>
          <Link to="/auth" className="inline-block mt-7">
            <Button
              size="lg"
              className="h-12 px-8 rounded-full bg-gradient-primary shadow-elegant gap-2"
            >
              Entrar no app <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-14">
          <p className="text-[11px] uppercase tracking-[0.25em] text-accent-foreground/80 mb-3">
            Planos e preços
          </p>
          <h2 className="font-display text-4xl sm:text-5xl tracking-tight">
            Escolha o plano <em className="italic text-primary">ideal</em> para você.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Todos os planos incluem <strong className="text-foreground">30 dias de teste grátis</strong>. Sem compromisso — cancele quando quiser durante o período.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-3xl border p-8 flex flex-col backdrop-blur transition-smooth ${
                p.highlighted
                  ? "border-primary/60 bg-card shadow-elegant md:scale-[1.04] relative"
                  : "border-border/60 bg-card/70 hover:shadow-soft"
              }`}
            >
              {p.highlighted && (
                <span className="self-start mb-4 text-[11px] uppercase tracking-[0.18em] font-semibold px-3 py-1 rounded-full bg-gradient-gold text-foreground/80 shadow-gold">
                  Mais popular
                </span>
              )}
              <h3 className="font-display text-2xl">{p.name}</h3>
              <p className="text-sm text-muted-foreground mt-1.5">{p.description}</p>
              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="font-display text-5xl tracking-tight">{p.price}</span>
                <span className="text-muted-foreground">{p.period}</span>
              </div>
              <ul className="mt-7 space-y-3 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/85">
                    <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="mt-8 block">
                <Button
                  size="lg"
                  className={`w-full h-12 rounded-full ${
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
          <Link to="/reembolso" className="underline hover:text-foreground">Política de Reembolso</Link>,{" "}
          <Link to="/privacidade" className="underline hover:text-foreground">Privacidade</Link> e{" "}
          <Link to="/termos" className="underline hover:text-foreground">Termos de Uso</Link>.
        </p>
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground space-y-3">
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link to="/precos" className="hover:text-foreground transition-smooth">Preços</Link>
          <Link to="/termos" className="hover:text-foreground transition-smooth">Termos de Uso</Link>
          <Link to="/privacidade" className="hover:text-foreground transition-smooth">Privacidade</Link>
          <Link to="/reembolso" className="hover:text-foreground transition-smooth">Reembolso</Link>
        </nav>
        <div>© {new Date().getFullYear()} Belle Nails · Feito com carinho.</div>
      </footer>
    </div>
  );
};

export default Landing;
