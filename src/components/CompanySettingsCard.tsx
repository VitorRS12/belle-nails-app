import { useEffect, useState } from "react";
import { Building2, Clock, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompany } from "@/hooks/useCompany";

const INTERVAL_PRESETS = [10, 15, 20, 30, 45, 60];
const REMINDER_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "1h antes" },
  { value: 2, label: "2h antes" },
  { value: 6, label: "6h antes" },
  { value: 12, label: "12h antes" },
  { value: 24, label: "24h antes" },
  { value: 48, label: "48h antes" },
];

export function CompanySettingsCard() {
  const { company, loading, update } = useCompany();
  const [name, setName] = useState("");
  const [intervalMode, setIntervalMode] = useState<string>("30");
  const [customInterval, setCustomInterval] = useState<string>("");
  const [reminders, setReminders] = useState<number[]>([24]);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (company && !hydrated) {
      setName(company.name);
      const v = company.appointment_interval_minutes ?? 30;
      if (INTERVAL_PRESETS.includes(v)) {
        setIntervalMode(String(v));
        setCustomInterval("");
      } else {
        setIntervalMode("custom");
        setCustomInterval(String(v));
      }
      setReminders(
        Array.isArray(company.reminder_hours_before) && company.reminder_hours_before.length
          ? [...company.reminder_hours_before].sort((a, b) => b - a)
          : [24],
      );
      setHydrated(true);
    }
  }, [company, hydrated]);

  const resolvedInterval = (() => {
    if (intervalMode === "custom") {
      const n = parseInt(customInterval, 10);
      return Number.isFinite(n) ? n : NaN;
    }
    return parseInt(intervalMode, 10);
  })();

  const intervalValid =
    Number.isFinite(resolvedInterval) && resolvedInterval >= 5 && resolvedInterval <= 240;

  const remindersDirty =
    !!company &&
    JSON.stringify([...reminders].sort()) !==
      JSON.stringify([...(company.reminder_hours_before ?? [24])].sort());

  const dirty =
    !!company &&
    (name.trim() !== company.name ||
      (intervalValid && resolvedInterval !== company.appointment_interval_minutes) ||
      remindersDirty);

  const toggleReminder = (h: number) => {
    setReminders((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h].sort((a, b) => b - a),
    );
  };

  const handleSave = async () => {
    if (!dirty || !intervalValid) return;
    setSaving(true);
    await update({
      name: name.trim(),
      appointment_interval_minutes: resolvedInterval,
      reminder_hours_before: [...reminders].sort((a, b) => b - a),
    });
    setSaving(false);
  };

  return (
    <div className="rounded-2xl bg-card border border-border/60 p-5 shadow-soft">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-11 w-11 rounded-full bg-gradient-primary/10 text-primary inline-flex items-center justify-center">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-lg">Minha empresa</h3>
          <p className="text-xs text-muted-foreground">
            Essas informações aparecerão na sua página pública de agendamentos.
          </p>
        </div>
      </div>

      {loading || !company ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="company-name">Nome</Label>
            <Input
              id="company-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da sua empresa"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Intervalo da agenda
            </Label>
            <Select value={intervalMode} onValueChange={setIntervalMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INTERVAL_PRESETS.map((m) => (
                  <SelectItem key={m} value={String(m)}>{m} minutos</SelectItem>
                ))}
                <SelectItem value="custom">Personalizado…</SelectItem>
              </SelectContent>
            </Select>
            {intervalMode === "custom" && (
              <Input
                type="number"
                min={5}
                max={240}
                step={5}
                placeholder="Minutos (entre 5 e 240)"
                value={customInterval}
                onChange={(e) => setCustomInterval(e.target.value)}
                className={!intervalValid ? "border-destructive" : ""}
              />
            )}
            <p className="text-[11px] text-muted-foreground">
              Define de quanto em quanto tempo os horários da agenda são gerados.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Link público</Label>
            <a
              href={`/b/${company.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-primary font-mono px-3 py-2 rounded-md border border-dashed border-border bg-muted/30 hover:bg-accent-soft/40 transition-smooth break-all"
            >
              {typeof window !== "undefined" ? window.location.origin : ""}/b/{company.slug}
            </a>
            <p className="text-[11px] text-muted-foreground">
              Compartilhe este link para suas clientes agendarem online.
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={!dirty || saving || !intervalValid}
            className="w-full bg-gradient-primary shadow-elegant rounded-xl"
          >
            {saving ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      )}
    </div>
  );
}
