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
  Check,
  Star,
  Clock,
  Mail,
  HeartHandshake,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
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

const features = [
  {
    icon: CalendarDays,
    title: "Agendamento inteligente",
    desc: "Sua cliente agenda online em poucos toques e recebe a confirmação por e-mail automaticamente.",
  },
  {
    icon: Users,
    title: "Gestão de profissionais",
    desc: "Cada profissional controla a própria agenda e recebe as solicitações em tempo real.",
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

const testimonials = [
  {
    quote:
      "Minha agenda ficou impecável. As clientes agendam sozinhas e eu só preciso confirmar.",
    name: "Ana Beatriz",
    role: "Nail designer · São Paulo",
  },
  {
    quote:
      "Reduzi faltas em 70% depois que passei a mandar lembretes automáticos. Vale cada centavo.",
    name: "Carolina Freitas",
    role: "Estúdio de cílios · Rio de Janeiro",
  },
  {
    quote:
      "Simples e bonito. Minhas clientes elogiam sempre a página de agendamento.",
    name: "Marina Souza",
    role: "Design de sobrancelhas · Belo Horizonte",
  },
];

const faqs = [
  {
    q: "Como funciona o teste grátis?",
    a: "Você tem 30 dias completos para usar o Belle Nails sem custo algum. Não pedimos cartão para começar e você pode cancelar quando quiser durante o período.",
  },
  {
    q: "Preciso instalar algo?",
    a: "Não. O Belle Nails funciona direto no navegador do seu celular ou computador. Você também pode adicionar à tela inicial como um app.",
  },
  {
    q: "As minhas clientes precisam criar conta?",
    a: "Não. Elas agendam pela sua página pública informando apenas nome, contato e o serviço desejado.",
  },
  {
    q: "Posso mudar de plano depois?",
    a: "Sim. Você pode fazer upgrade ou downgrade a qualquer momento — o valor é ajustado proporcionalmente.",
  },
  {
    q: "Como é feita a cobrança?",
    a: "Os pagamentos são processados pela Paddle.com como Merchant of Record, com todas as garantias legais e reembolso em até 30 dias.",
  },
];

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left rounded-2xl border border-border/60 bg-card/60 backdrop-blur px-6 py-5 transition-smooth hover:border-primary/40 hover:shadow-soft"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="font-display text-lg leading-snug text-foreground">
          {q}
        </span>
        <ChevronDown
          className={`h-4 w-4 mt-1.5 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>
      {open && (
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed animate-fade-in">
          {a}
        </p>
      )}
    </button>
  );
};

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
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Decorative petals */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 40% 30% at 15% 8%, hsl(var(--primary) / 0.18), transparent 60%), radial-gradient(ellipse 35% 25% at 90% 20%, hsl(var(--accent) / 0.14), transparent 65%), radial-gradient(ellipse 50% 35% at 50% 100%, hsl(var(--primary-glow) / 0.15), transparent 60%)",
        }}
      />

      {/* Top bar */}
      <header className="relative max-w-6xl mx-auto px-6 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-2xl bg-gradient-primary shadow-elegant flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-xl tracking-wide">Belle Nails</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#recursos" className="hover:text-foreground transition-smooth">Recursos</a>
          <a href="#depoimentos" className="hover:text-foreground transition-smooth">Depoimentos</a>
          <a href="#precos" className="hover:text-foreground transition-smooth">Preços</a>
          <a href="#faq" className="hover:text-foreground transition-smooth">FAQ</a>
        </nav>
        <Link to="/auth">
          <Button variant="ghost" className="rounded-full">
            Entrar
          </Button>
        </Link>
      </header>

      <main id="main" className="relative">
        {/* ============ HERO BENTO ============ */}
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-16">
          <div className="grid grid-cols-12 auto-rows-[minmax(0,auto)] gap-4 md:gap-5">
            {/* Headline card */}
            <div className="col-span-12 md:col-span-8 rounded-[2rem] border border-border/60 bg-card/70 backdrop-blur p-8 md:p-12 shadow-soft relative overflow-hidden">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3.5 py-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Para profissionais de beleza
              </div>
              <h1 className="font-display text-5xl sm:text-6xl md:text-7xl leading-[1.02] tracking-tight">
                A agenda
                <br />
                <em className="italic text-primary font-medium">elegante</em>{" "}
                do seu salão.
              </h1>
              <p className="mt-6 max-w-lg text-base sm:text-lg text-muted-foreground leading-relaxed">
                Receba clientes, organize horários e acompanhe seu negócio com um app feito sob medida para quem cuida da beleza.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Link to="/auth">
                  <Button
                    size="lg"
                    className="h-12 px-7 rounded-full bg-gradient-primary shadow-elegant gap-2 hover:scale-[1.02] transition-transform"
                  >
                    Começar 30 dias grátis <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#recursos">
                  <Button size="lg" variant="ghost" className="h-12 px-6 rounded-full">
                    Ver recursos
                  </Button>
                </a>
              </div>
              <div className="mt-8 flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex -space-x-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-7 w-7 rounded-full border-2 border-card bg-gradient-primary"
                      style={{ opacity: 0.55 + i * 0.12 }}
                    />
                  ))}
                </div>
                <span>
                  <strong className="text-foreground">+120</strong> salões já usam
                </span>
                <span className="hidden sm:flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                  <span className="ml-1">4.9/5</span>
                </span>
              </div>
              {/* petal ornament */}
              <Sparkles className="absolute top-8 right-8 h-16 w-16 text-primary/10" />
            </div>

            {/* Product screenshot card */}
            <div className="col-span-12 md:col-span-4 rounded-[2rem] border border-border/60 bg-gradient-primary p-1 shadow-elegant overflow-hidden">
              <div className="h-full rounded-[calc(2rem-4px)] bg-card/95 overflow-hidden flex flex-col">
                <div className="px-5 pt-5 pb-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                    Painel
                  </span>
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                    <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted" />
                  </span>
                </div>
                <img
                  src={dashboardShot.url}
                  alt="Painel do Belle Nails"
                  loading="lazy"
                  className="w-full flex-1 object-cover object-top"
                />
              </div>
            </div>

            {/* Stat card 1 */}
            <div className="col-span-6 md:col-span-3 rounded-[2rem] border border-border/60 bg-card/70 backdrop-blur p-6 shadow-soft">
              <Clock className="h-5 w-5 text-primary mb-3" />
              <div className="font-display text-4xl md:text-5xl tracking-tight">
                24/7
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Agendamento aberto o tempo todo, mesmo quando você dorme.
              </p>
            </div>

            {/* Stat card 2 */}
            <div className="col-span-6 md:col-span-3 rounded-[2rem] border border-border/60 bg-gradient-gold shadow-gold p-6">
              <HeartHandshake className="h-5 w-5 text-foreground/80 mb-3" />
              <div className="font-display text-4xl md:text-5xl tracking-tight text-foreground">
                −70%
              </div>
              <p className="mt-1 text-xs text-foreground/70 leading-relaxed">
                de faltas com lembretes automáticos 24h antes.
              </p>
            </div>

            {/* Testimonial card */}
            <div className="col-span-12 md:col-span-6 rounded-[2rem] border border-border/60 bg-card/70 backdrop-blur p-8 shadow-soft flex flex-col justify-between">
              <div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="font-display text-xl md:text-2xl italic leading-snug text-foreground">
                  “Minhas clientes elogiam sempre a página de agendamento — parece um app de verdade.”
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-primary" />
                <div>
                  <div className="text-sm font-medium">Marina Souza</div>
                  <div className="text-xs text-muted-foreground">Design de sobrancelhas · BH</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ TRUSTED / STATS STRIP ============ */}
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <div className="rounded-[2rem] border border-border/60 bg-card/60 backdrop-blur px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { k: "+120", v: "salões atendidos" },
              { k: "+18k", v: "agendamentos mensais" },
              { k: "99,9%", v: "uptime da plataforma" },
              { k: "30 dias", v: "de teste grátis" },
            ].map((s) => (
              <div key={s.v}>
                <div className="font-display text-3xl md:text-4xl text-primary tracking-tight">
                  {s.k}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ FEATURES BENTO ============ */}
        <section id="recursos" className="max-w-6xl mx-auto px-6 pb-20">
          <div className="text-center mb-14">
            <p className="text-[11px] uppercase tracking-[0.28em] text-accent-foreground/80 mb-3">
              Recursos
            </p>
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight">
              Tudo o que seu salão precisa,
              <br />
              <em className="italic text-primary">nada que atrapalhe</em>.
            </h2>
          </div>

          <div className="grid grid-cols-12 gap-4 md:gap-5">
            {/* Big feature card w/ screenshot */}
            <article className="col-span-12 md:col-span-7 rounded-[2rem] border border-border/60 bg-card/70 backdrop-blur p-8 md:p-10 shadow-soft overflow-hidden group">
              <div className="h-11 w-11 rounded-2xl bg-gradient-primary shadow-elegant flex items-center justify-center mb-5">
                <CalendarDays className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-display text-2xl md:text-3xl mb-2">
                Agenda que parece um app de verdade
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                Visualização semanal, conflitos evitados automaticamente, bloqueios de horário e jornadas por profissional.
              </p>
              <div className="mt-6 rounded-2xl overflow-hidden border border-border/50 shadow-soft">
                <img
                  src={agendaShot.url}
                  alt="Agenda semanal"
                  loading="lazy"
                  className="w-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
            </article>

            {/* Right column stacked */}
            <div className="col-span-12 md:col-span-5 grid gap-4 md:gap-5">
              <article className="rounded-[2rem] border border-border/60 bg-gradient-gold shadow-gold p-8">
                <Mail className="h-5 w-5 text-foreground/80 mb-4" />
                <h3 className="font-display text-2xl mb-1.5 text-foreground">
                  E-mails automáticos
                </h3>
                <p className="text-sm text-foreground/75 leading-relaxed">
                  Confirmação, lembrete 24h antes e recados internos — enviados sem você mexer um dedo.
                </p>
              </article>
              <article className="rounded-[2rem] border border-border/60 bg-card/70 backdrop-blur p-8 shadow-soft">
                <ShieldCheck className="h-5 w-5 text-primary mb-4" />
                <h3 className="font-display text-2xl mb-1.5">
                  Dados protegidos
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Cada profissional só acessa as próprias clientes. Criptografia de ponta a ponta.
                </p>
              </article>
            </div>

            {/* Bottom row of smaller cards */}
            {features.slice(1, 4).map(({ icon: Icon, title, desc }) => (
              <article
                key={title}
                className="col-span-12 md:col-span-4 rounded-[2rem] border border-border/60 bg-card/70 backdrop-blur p-7 shadow-soft hover:shadow-elegant transition-smooth"
              >
                <div className="h-10 w-10 rounded-xl bg-accent-soft flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-xl mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ============ SCREENSHOTS ============ */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="text-center mb-12">
            <p className="text-[11px] uppercase tracking-[0.28em] text-accent-foreground/80 mb-3">
              Veja por dentro
            </p>
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight">
              Uma interface pensada
              <br />
              <em className="italic text-primary">nos mínimos detalhes</em>.
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { src: dashboardShot.url, label: "Painel", alt: "Painel" },
              { src: agendaShot.url, label: "Agenda", alt: "Agenda" },
              { src: clientesShot.url, label: "Clientes", alt: "Clientes" },
            ].map(({ src, alt, label }) => (
              <div key={label} className="group">
                <div className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur overflow-hidden shadow-soft hover:shadow-elegant transition-smooth">
                  <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    className="w-full h-auto object-contain group-hover:scale-[1.03] transition-transform duration-500"
                  />
                </div>
                <p className="mt-3 text-center text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ============ TESTIMONIALS ============ */}
        <section id="depoimentos" className="max-w-6xl mx-auto px-6 pb-24">
          <div className="text-center mb-12">
            <p className="text-[11px] uppercase tracking-[0.28em] text-accent-foreground/80 mb-3">
              Depoimentos
            </p>
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight">
              Quem usa,
              <em className="italic text-primary"> ama</em>.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-[2rem] border border-border/60 bg-card/70 backdrop-blur p-7 shadow-soft"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="font-display text-lg italic leading-snug text-foreground">
                  “{t.quote}”
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-primary" />
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ PRICING ============ */}
        <section id="precos" className="max-w-6xl mx-auto px-6 pb-24">
          <div className="text-center mb-14">
            <p className="text-[11px] uppercase tracking-[0.28em] text-accent-foreground/80 mb-3">
              Planos e preços
            </p>
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight">
              Escolha o plano <em className="italic text-primary">ideal</em>{" "}
              para você.
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Todos os planos incluem{" "}
              <strong className="text-foreground">30 dias de teste grátis</strong>. Sem compromisso — cancele quando quiser durante o período.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`rounded-[2rem] border p-8 flex flex-col backdrop-blur transition-smooth ${
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
                <h3 className="font-display text-3xl">{p.name}</h3>
                <p className="text-sm text-muted-foreground mt-1.5">
                  {p.description}
                </p>
                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="font-display text-5xl tracking-tight">
                    {p.price}
                  </span>
                  <span className="text-muted-foreground">{p.period}</span>
                </div>
                <ul className="mt-7 space-y-3 flex-1">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-sm text-foreground/85"
                    >
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
            <Link to="/reembolso" className="underline hover:text-foreground">
              Política de Reembolso
            </Link>
            ,{" "}
            <Link to="/privacidade" className="underline hover:text-foreground">
              Privacidade
            </Link>{" "}
            e{" "}
            <Link to="/termos" className="underline hover:text-foreground">
              Termos de Uso
            </Link>
            .
          </p>
        </section>

        {/* ============ FAQ ============ */}
        <section id="faq" className="max-w-3xl mx-auto px-6 pb-24">
          <div className="text-center mb-12">
            <p className="text-[11px] uppercase tracking-[0.28em] text-accent-foreground/80 mb-3">
              Perguntas frequentes
            </p>
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight">
              A gente <em className="italic text-primary">responde</em>.
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="rounded-[2.5rem] border border-primary/40 bg-gradient-primary px-8 py-16 text-center shadow-elegant relative overflow-hidden">
            <Sparkles className="absolute top-8 left-8 h-10 w-10 text-primary-foreground/20" />
            <Sparkles className="absolute bottom-8 right-8 h-14 w-14 text-primary-foreground/20" />
            <h3 className="font-display text-4xl sm:text-5xl tracking-tight text-primary-foreground">
              Pronta para encantar{" "}
              <em className="italic">suas clientes?</em>
            </h3>
            <p className="mt-4 text-primary-foreground/85 max-w-md mx-auto">
              Crie sua conta gratuitamente e comece a organizar sua agenda em minutos.
            </p>
            <Link to="/auth" className="inline-block mt-8">
              <Button
                size="lg"
                variant="secondary"
                className="h-12 px-8 rounded-full gap-2 hover:scale-[1.03] transition-transform"
              >
                Começar 30 dias grátis <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-border/50 py-10 text-center text-xs text-muted-foreground space-y-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-6 w-6 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Sparkles className="h-3 w-3 text-primary-foreground" />
          </div>
          <span className="font-display text-base tracking-wide text-foreground">Belle Nails</span>
        </div>
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
