import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ListSkeleton } from "@/components/ListSkeleton";
import { toast } from "sonner";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  UserRound,
  CalendarDays,
  Mail,
  Phone,
  Loader2,
} from "lucide-react";

type Step = "service" | "professional" | "date" | "time" | "contact" | "done";

interface PublicService {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  duration_minutes: number;
  price: number;
  color: string | null;
}

interface PublicProfessional {
  id: string;
  name: string;
  photo_url: string | null;
  bio: string | null;
  specialties: string[];
}

interface PublicLink {
  professional_id: string;
  service_id: string;
}

interface PublicCompany {
  id: string;
  name: string;
  slug: string;
  segment: string | null;
  timezone: string;
}

interface CompanyResponse {
  company: PublicCompany;
  services: PublicService[];
  professionals: PublicProfessional[];
  links: PublicLink[];
}

export default function PublicBooking() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<CompanyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [step, setStep] = useState<Step>("service");
  const [serviceId, setServiceId] = useState<string>("");
  const [professionalId, setProfessionalId] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>("");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    company: string;
    professional: string;
    service: string;
  } | null>(null);

  useEffect(() => {
    if (!slug) return;
    void (async () => {
      setLoading(true);
      const { data: res, error } = await supabase.functions.invoke(
        `public-company?slug=${encodeURIComponent(slug)}`,
        { method: "GET" }
      );
      if (error || !res || (res as { error?: string }).error) {
        setNotFound(true);
      } else {
        setData(res as CompanyResponse);
      }
      setLoading(false);
    })();
  }, [slug]);

  const service = useMemo(
    () => data?.services.find((s) => s.id === serviceId) ?? null,
    [data, serviceId]
  );

  const availableProfessionals = useMemo(() => {
    if (!data) return [];
    if (!serviceId) return data.professionals;
    const linkedIds = new Set(
      data.links.filter((l) => l.service_id === serviceId).map((l) => l.professional_id)
    );
    // If no links exist for any service, fall back to all professionals
    const anyLinks = data.links.some((l) => l.service_id === serviceId);
    return anyLinks
      ? data.professionals.filter((p) => linkedIds.has(p.id))
      : data.professionals;
  }, [data, serviceId]);

  const fetchSlots = useCallback(async () => {
    if (!data || !serviceId || !professionalId || !date) return;
    setLoadingSlots(true);
    setSlots(null);
    const dateStr = format(date, "yyyy-MM-dd");
    const { data: res, error } = await supabase.functions.invoke("public-availability", {
      body: {
        companyId: data.company.id,
        professionalId,
        serviceId,
        date: dateStr,
      },
    });
    setLoadingSlots(false);
    if (error || !res || (res as { error?: string }).error) {
      toast.error("Não foi possível carregar horários");
      setSlots([]);
      return;
    }
    setSlots((res as { slots: string[] }).slots ?? []);
  }, [data, serviceId, professionalId, date]);

  useEffect(() => {
    if (step === "time") void fetchSlots();
  }, [step, fetchSlots]);

  const submit = async () => {
    if (!data || !slug || !serviceId || !professionalId || !date || !time) return;
    if (!customerName.trim()) {
      toast.error("Informe seu nome");
      return;
    }
    if (!customerEmail.trim() && !customerPhone.trim()) {
      toast.error("Informe e-mail ou telefone para contato");
      return;
    }
    setSubmitting(true);
    const { data: res, error } = await supabase.functions.invoke(
      "public-create-booking",
      {
        body: {
          companySlug: slug,
          professionalId,
          serviceId,
          date: format(date, "yyyy-MM-dd"),
          time,
          customerName,
          customerEmail: customerEmail.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      }
    );
    setSubmitting(false);
    const err = (res as { error?: string })?.error ?? error?.message;
    if (err) {
      toast.error(err);
      return;
    }
    const r = res as { company: string; professional: string; service: string };
    setConfirmation({ company: r.company, professional: r.professional, service: r.service });
    setStep("done");
  };

  if (loading) {
    return (
      <Shell>
        <ListSkeleton rows={4} />
      </Shell>
    );
  }
  if (notFound || !data) {
    return (
      <Shell>
        <div className="text-center py-20">
          <h1 className="font-display text-2xl mb-2">Empresa não encontrada</h1>
          <p className="text-sm text-muted-foreground">
            Verifique o link e tente novamente.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <header className="text-center space-y-1 mb-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">
          Agendar online
        </p>
        <h1 className="font-display text-3xl text-foreground">{data.company.name}</h1>
        {data.company.segment && (
          <p className="text-sm text-muted-foreground">{data.company.segment}</p>
        )}
      </header>

      <Stepper step={step} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
          className="mt-6"
        >
          {step === "service" && (
            <Section title="Escolha o serviço">
              {data.services.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Esta empresa ainda não cadastrou serviços para agendamento online.
                </p>
              ) : (
                <ul className="grid gap-3">
                  {data.services.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setServiceId(s.id);
                          setProfessionalId("");
                          setStep("professional");
                        }}
                        className="w-full text-left rounded-2xl border border-border/60 bg-card p-4 shadow-soft hover:bg-accent-soft/30 transition-smooth flex items-start gap-3"
                      >
                        <span
                          className="h-10 w-10 rounded-xl shrink-0"
                          style={{ background: s.color || "hsl(var(--primary) / 0.15)" }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-display text-lg truncate">{s.name}</h3>
                            {s.category && (
                              <Badge variant="outline">{s.category}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {s.duration_minutes} min
                            </span>
                            <span className="font-medium text-primary">
                              R$ {s.price.toFixed(2).replace(".", ",")}
                            </span>
                          </div>
                          {s.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {s.description}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}

          {step === "professional" && (
            <Section
              title="Escolha a profissional"
              onBack={() => setStep("service")}
            >
              {availableProfessionals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhuma profissional disponível para este serviço.
                </p>
              ) : (
                <ul className="grid gap-3">
                  {availableProfessionals.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setProfessionalId(p.id);
                          setStep("date");
                        }}
                        className="w-full text-left rounded-2xl border border-border/60 bg-card p-4 shadow-soft hover:bg-accent-soft/30 transition-smooth flex items-start gap-3"
                      >
                        <div className="h-12 w-12 rounded-full bg-gradient-primary text-primary-foreground inline-flex items-center justify-center shrink-0">
                          {p.photo_url ? (
                            <img
                              src={p.photo_url}
                              alt={p.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <UserRound className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-lg truncate">{p.name}</h3>
                          {p.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {p.specialties.map((sp) => (
                                <Badge key={sp} variant="secondary" className="text-[10px]">
                                  {sp}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {p.bio && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {p.bio}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}

          {step === "date" && (
            <Section title="Escolha a data" onBack={() => setStep("professional")}>
              <div className="rounded-2xl bg-card border border-border/60 p-2 sm:p-4 shadow-soft flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (!d) return;
                    setDate(d);
                    setTime("");
                    setStep("time");
                  }}
                  locale={ptBR}
                  fromDate={new Date()}
                  className="rounded-md"
                />
              </div>
            </Section>
          )}

          {step === "time" && (
            <Section
              title={date ? format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }) : "Horário"}
              onBack={() => setStep("date")}
            >
              {loadingSlots ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : !slots || slots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum horário disponível nesta data. Escolha outra.
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTime(t);
                        setStep("contact");
                      }}
                      className="rounded-xl border border-border/60 bg-card px-3 py-2 text-sm font-medium hover:bg-gradient-primary hover:text-primary-foreground transition-smooth"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </Section>
          )}

          {step === "contact" && service && (
            <Section title="Seus dados" onBack={() => setStep("time")}>
              <div className="rounded-2xl bg-gradient-soft p-3 mb-4 text-sm">
                <p className="font-medium">{service.name}</p>
                <p className="text-xs text-muted-foreground">
                  {date && format(date, "dd/MM/yyyy", { locale: ptBR })} · {time} ·{" "}
                  {service.duration_minutes} min · R$ {service.price.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="c-name">Nome completo</Label>
                  <Input
                    id="c-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    maxLength={120}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-phone" className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Telefone (WhatsApp)
                  </Label>
                  <Input
                    id="c-phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    maxLength={30}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-email" className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> E-mail (opcional)
                  </Label>
                  <Input
                    id="c-email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    maxLength={255}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-notes">Observações (opcional)</Label>
                  <Textarea
                    id="c-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={500}
                  />
                </div>
                <Button
                  onClick={submit}
                  disabled={submitting}
                  className="w-full bg-gradient-primary h-11 shadow-elegant"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Confirmar agendamento"
                  )}
                </Button>
              </div>
            </Section>
          )}

          {step === "done" && confirmation && (
            <Section title="Tudo certo!">
              <div className="text-center py-6 space-y-3">
                <div className="mx-auto h-16 w-16 rounded-full bg-gradient-primary text-primary-foreground inline-flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="font-display text-2xl">Agendamento enviado</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Seu pedido foi enviado para <strong>{confirmation.company}</strong>. Você
                  receberá uma confirmação assim que <strong>{confirmation.professional}</strong>{" "}
                  aprovar o horário.
                </p>
                <div className="rounded-2xl bg-gradient-soft p-3 inline-block text-left text-sm">
                  <p>
                    <Sparkles className="h-3.5 w-3.5 inline mr-1.5 text-primary" />
                    {confirmation.service}
                  </p>
                  <p>
                    <CalendarDays className="h-3.5 w-3.5 inline mr-1.5 text-primary" />
                    {date && format(date, "dd/MM/yyyy", { locale: ptBR })} às {time}
                  </p>
                </div>
              </div>
            </Section>
          )}
        </motion.div>
      </AnimatePresence>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">{children}</div>
    </div>
  );
}

function Section({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <h2 className="font-display text-xl capitalize">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Stepper({ step }: { step: Step }) {
  const order: Step[] = ["service", "professional", "date", "time", "contact"];
  const idx = order.indexOf(step);
  const total = order.length;
  return (
    <div className="flex items-center gap-1.5">
      {order.map((s, i) => (
        <div
          key={s}
          className={`h-1 flex-1 rounded-full transition-colors ${
            i <= (step === "done" ? total : idx)
              ? "bg-gradient-primary"
              : "bg-border"
          }`}
        />
      ))}
    </div>
  );
}
