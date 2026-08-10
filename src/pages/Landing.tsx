import { Link, Navigate } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/LanguageToggle";
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
import { PanelMockup, AgendaMockup, ClientsMockup } from "@/components/landing/AppMockups";


const PLAN_KEYS = ["starter", "pro", "business"] as const;
const PLAN_PRICES: Record<(typeof PLAN_KEYS)[number], string> = {
  starter: "R$ 30",
  pro: "R$ 49",
  business: "R$ 99",
};

const FEATURE_ICONS = [
  CalendarDays,
  Users,
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
] as const;
const FEATURE_KEYS = [
  "smartScheduling",
  "professionalManagement",
  "customizableAgenda",
  "automatedCommunication",
  "protectedData",
  "tailoredForSegment",
] as const;

const TESTIMONIAL_KEYS = ["ana", "carolina", "marina"] as const;

const FAQ_KEYS = ["trial", "install", "clientAccount", "changePlan", "billing"] as const;

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
  const { t } = useTranslation("landing");

  usePageMeta({
    title: t("meta.home.title"),
    description: t("meta.home.description"),
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
          <a href="#recursos" className="hover:text-foreground transition-smooth">{t("nav.features")}</a>
          <a href="#depoimentos" className="hover:text-foreground transition-smooth">{t("nav.testimonials")}</a>
          <a href="#precos" className="hover:text-foreground transition-smooth">{t("nav.pricing")}</a>
          <a href="#faq" className="hover:text-foreground transition-smooth">{t("nav.faq")}</a>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageToggle variant="full" />
          <Link to="/auth">
            <Button variant="ghost" className="rounded-full">
              {t("nav.login")}
            </Button>
          </Link>
        </div>
      </header>

      <main id="main" className="relative">
        {/* ============ HERO BENTO ============ */}
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-16">
          <div className="grid grid-cols-12 auto-rows-[minmax(0,auto)] gap-4 md:gap-5">
            {/* Headline card */}
            <div className="col-span-12 md:col-span-8 rounded-[2rem] border border-border/60 bg-card/70 backdrop-blur p-8 md:p-12 shadow-soft relative overflow-hidden">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3.5 py-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                {t("hero.badge")}
              </div>
              <h1 className="font-display text-5xl sm:text-6xl md:text-7xl leading-[1.02] tracking-tight">
                {t("hero.titleLine1")}
                <br />
                <em className="italic text-primary font-medium">{t("hero.titleEmphasis")}</em>{" "}
                {t("hero.titleLine2")}
              </h1>
              <p className="mt-6 max-w-lg text-base sm:text-lg text-muted-foreground leading-relaxed">
                {t("hero.description")}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Link to="/auth">
                  <Button
                    size="lg"
                    className="h-12 px-7 rounded-full bg-gradient-primary shadow-elegant gap-2 hover:scale-[1.02] transition-transform"
                  >
                    {t("hero.ctaStart")} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#recursos">
                  <Button size="lg" variant="ghost" className="h-12 px-6 rounded-full">
                    {t("hero.ctaFeatures")}
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
                  <Trans t={t} i18nKey="hero.socialProof" components={{ strong: <strong className="text-foreground" /> }} />
                </span>
                <span className="hidden sm:flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                  <span className="ml-1">{t("hero.rating")}</span>
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
                    {t("hero.panelLabel")}
                  </span>
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                    <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted" />
                  </span>
                </div>
                <img
                  src={dashboardShot.url}
                  alt={t("hero.panelAlt")}
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
                {t("hero.openAllTheTime")}
              </p>
            </div>

            {/* Stat card 2 */}
            <div className="col-span-6 md:col-span-3 rounded-[2rem] border border-border/60 bg-gradient-gold shadow-gold p-6">
              <HeartHandshake className="h-5 w-5 text-foreground/80 mb-3" />
              <div className="font-display text-4xl md:text-5xl tracking-tight text-foreground">
                −70%
              </div>
              <p className="mt-1 text-xs text-foreground/70 leading-relaxed">
                {t("hero.noShowsReduction")}
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
                  “{t("heroTestimonial.quote")}”
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-primary" />
                <div>
                  <div className="text-sm font-medium">{t("heroTestimonial.name")}</div>
                  <div className="text-xs text-muted-foreground">{t("heroTestimonial.role")}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ TRUSTED / STATS STRIP ============ */}
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <div className="rounded-[2rem] border border-border/60 bg-card/60 backdrop-blur px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { k: "+120", v: t("trustedStrip.salons") },
              { k: "+18k", v: t("trustedStrip.appointments") },
              { k: "99,9%", v: t("trustedStrip.uptime") },
              { k: "30 dias", v: t("trustedStrip.trial") },
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
              {t("features.eyebrow")}
            </p>
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight">
              {t("features.titleLine1")}
              <br />
              <em className="italic text-primary">{t("features.titleEmphasis")}</em>.
            </h2>
          </div>

          <div className="grid grid-cols-12 gap-4 md:gap-5">
            {/* Big feature card w/ screenshot */}
            <article className="col-span-12 md:col-span-7 rounded-[2rem] border border-border/60 bg-card/70 backdrop-blur p-8 md:p-10 shadow-soft overflow-hidden group">
              <div className="h-11 w-11 rounded-2xl bg-gradient-primary shadow-elegant flex items-center justify-center mb-5">
                <CalendarDays className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-display text-2xl md:text-3xl mb-2">
                {t("features.bigCard.title")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                {t("features.bigCard.desc")}
              </p>
              <div className="mt-6 rounded-2xl overflow-hidden border border-border/50 shadow-soft group-hover:scale-[1.02] transition-transform duration-500">
                <AgendaMockup />
              </div>

            </article>

            {/* Right column stacked */}
            <div className="col-span-12 md:col-span-5 grid gap-4 md:gap-5">
              <article className="rounded-[2rem] border border-border/60 bg-gradient-gold shadow-gold p-8">
                <Mail className="h-5 w-5 text-foreground/80 mb-4" />
                <h3 className="font-display text-2xl mb-1.5 text-foreground">
                  {t("features.autoEmails.title")}
                </h3>
                <p className="text-sm text-foreground/75 leading-relaxed">
                  {t("features.autoEmails.desc")}
                </p>
              </article>
              <article className="rounded-[2rem] border border-border/60 bg-card/70 backdrop-blur p-8 shadow-soft">
                <ShieldCheck className="h-5 w-5 text-primary mb-4" />
                <h3 className="font-display text-2xl mb-1.5">
                  {t("features.protectedDataCard.title")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("features.protectedDataCard.desc")}
                </p>
              </article>
            </div>

            {/* Bottom row of smaller cards */}
            {FEATURE_KEYS.slice(1, 4).map((key, idx) => {
              const Icon = FEATURE_ICONS[idx + 1];
              return (
                <article
                  key={key}
                  className="col-span-12 md:col-span-4 rounded-[2rem] border border-border/60 bg-card/70 backdrop-blur p-7 shadow-soft hover:shadow-elegant transition-smooth"
                >
                  <div className="h-10 w-10 rounded-xl bg-accent-soft flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display text-xl mb-1.5">{t(`features.${key}.title`)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(`features.${key}.desc`)}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        {/* ============ SCREENSHOTS ============ */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="text-center mb-12">
            <p className="text-[11px] uppercase tracking-[0.28em] text-accent-foreground/80 mb-3">
              {t("screenshots.eyebrow")}
            </p>
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight">
              {t("screenshots.titleLine1")}
              <br />
              <em className="italic text-primary">{t("screenshots.titleEmphasis")}</em>.
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { src: dashboardShot.url, label: t("screenshots.panel") },
              { src: agendaShot.url, label: t("screenshots.agenda") },
              { src: clientesShot.url, label: t("screenshots.clients") },
            ].map(({ src, label }) => (
              <div key={label} className="group">
                <div className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur overflow-hidden shadow-soft hover:shadow-elegant transition-smooth">
                  <img
                    src={src}
                    alt={label}
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
              {t("testimonials.eyebrow")}
            </p>
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight">
              {t("testimonials.titleLine1")}
              <em className="italic text-primary"> {t("testimonials.titleEmphasis")}</em>.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIAL_KEYS.map((key) => (
              <div
                key={key}
                className="rounded-[2rem] border border-border/60 bg-card/70 backdrop-blur p-7 shadow-soft"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="font-display text-lg italic leading-snug text-foreground">
                  “{t(`testimonials.items.${key}.quote`)}”
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-primary" />
                  <div>
                    <div className="text-sm font-medium">{t(`testimonials.items.${key}.name`)}</div>
                    <div className="text-xs text-muted-foreground">{t(`testimonials.items.${key}.role`)}</div>
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
              {t("pricing.eyebrow")}
            </p>
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight">
              {t("pricing.titleLine1")} <em className="italic text-primary">{t("pricing.titleEmphasis")}</em>{" "}
              {t("pricing.titleLine2")}
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              <Trans t={t} i18nKey="pricing.subtitle" components={{ strong: <strong className="text-foreground" /> }} />
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PLAN_KEYS.map((key) => {
              const highlighted = key === "pro";
              const featureKeys = Object.keys(
                t(`pricing.plans.${key}.features`, { returnObjects: true }) as Record<string, string>,
              );
              return (
                <div
                  key={key}
                  className={`rounded-[2rem] border p-8 flex flex-col backdrop-blur transition-smooth ${
                    highlighted
                      ? "border-primary/60 bg-card shadow-elegant md:scale-[1.04] relative"
                      : "border-border/60 bg-card/70 hover:shadow-soft"
                  }`}
                >
                  {highlighted && (
                    <span className="self-start mb-4 text-[11px] uppercase tracking-[0.18em] font-semibold px-3 py-1 rounded-full bg-gradient-gold text-foreground/80 shadow-gold">
                      {t("pricing.popular")}
                    </span>
                  )}
                  <h3 className="font-display text-3xl">{t(`pricing.plans.${key}.name`)}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    {t(`pricing.plans.${key}.description`)}
                  </p>
                  <div className="mt-6 flex items-baseline gap-1.5">
                    <span className="font-display text-5xl tracking-tight">
                      {PLAN_PRICES[key]}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <ul className="mt-7 space-y-3 flex-1">
                    {featureKeys.map((fk) => (
                      <li
                        key={fk}
                        className="flex items-start gap-2.5 text-sm text-foreground/85"
                      >
                        <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <span>{t(`pricing.plans.${key}.features.${fk}`)}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth" className="mt-8 block">
                    <Button
                      size="lg"
                      className={`w-full h-12 rounded-full ${
                        highlighted ? "bg-gradient-primary shadow-elegant" : ""
                      }`}
                      variant={highlighted ? "default" : "outline"}
                    >
                      {t("pricing.plans.cta")}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-10">
            <Trans
              t={t}
              i18nKey="pricing.footer"
              components={{
                refund: <Link to="/reembolso" className="underline hover:text-foreground" />,
                privacy: <Link to="/privacidade" className="underline hover:text-foreground" />,
                terms: <Link to="/termos" className="underline hover:text-foreground" />,
              }}
              values={{
                refund: t("pricing.refundPolicy"),
                privacy: t("pricing.privacyPolicy"),
                terms: t("pricing.termsOfUse"),
              }}
            />
          </p>
        </section>

        {/* ============ FAQ ============ */}
        <section id="faq" className="max-w-3xl mx-auto px-6 pb-24">
          <div className="text-center mb-12">
            <p className="text-[11px] uppercase tracking-[0.28em] text-accent-foreground/80 mb-3">
              {t("faq.eyebrow")}
            </p>
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight">
              {t("faq.titleLine1")} <em className="italic text-primary">{t("faq.titleEmphasis")}</em>.
            </h2>
          </div>
          <div className="space-y-3">
            {FAQ_KEYS.map((key) => (
              <FaqItem key={key} q={t(`faq.items.${key}.q`)} a={t(`faq.items.${key}.a`)} />
            ))}
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="rounded-[2.5rem] border border-primary/40 bg-gradient-primary px-8 py-16 text-center shadow-elegant relative overflow-hidden">
            <Sparkles className="absolute top-8 left-8 h-10 w-10 text-primary-foreground/20" />
            <Sparkles className="absolute bottom-8 right-8 h-14 w-14 text-primary-foreground/20" />
            <h3 className="font-display text-4xl sm:text-5xl tracking-tight text-primary-foreground">
              {t("finalCta.titleLine1")}{" "}
              <em className="italic">{t("finalCta.titleEmphasis")}</em>
            </h3>
            <p className="mt-4 text-primary-foreground/85 max-w-md mx-auto">
              {t("finalCta.description")}
            </p>
            <Link to="/auth" className="inline-block mt-8">
              <Button
                size="lg"
                variant="secondary"
                className="h-12 px-8 rounded-full gap-2 hover:scale-[1.03] transition-transform"
              >
                {t("finalCta.cta")} <ArrowRight className="h-4 w-4" />
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
          <Link to="/precos" className="hover:text-foreground transition-smooth">{t("footer.pricing")}</Link>
          <Link to="/termos" className="hover:text-foreground transition-smooth">{t("footer.terms")}</Link>
          <Link to="/privacidade" className="hover:text-foreground transition-smooth">{t("footer.privacy")}</Link>
          <Link to="/reembolso" className="hover:text-foreground transition-smooth">{t("footer.refund")}</Link>
        </nav>
        <div>{t("footer.copyright", { year: new Date().getFullYear() })}</div>
      </footer>
    </div>
  );
};

export default Landing;
