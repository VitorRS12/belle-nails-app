import { useState } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCompany } from "@/hooks/useCompany";

const SEGMENTS = [
  "Beleza e estética",
  "Saúde e bem-estar",
  "Barbearia",
  "Salão de cabelo",
  "Clínica",
  "Consultório",
  "Personal trainer",
  "Outro",
];

export function CompanySettingsCard() {
  const { company, loading, update } = useCompany();
  const [name, setName] = useState("");
  const [segment, setSegment] = useState("");
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  // Hydrate local state once company loads
  if (company && !touched && (name === "" && segment === "")) {
    setName(company.name);
    setSegment(company.segment ?? "");
  }

  const dirty =
    !!company &&
    (name.trim() !== company.name || (segment || null) !== (company.segment || null));

  const handleSave = async () => {
    if (!dirty) return;
    setSaving(true);
    await update({ name: name.trim(), segment: segment || null });
    setSaving(false);
    setTouched(true);
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
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="company-name">Nome</Label>
            <Input
              id="company-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setTouched(true); }}
              placeholder="Nome da sua empresa"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company-segment">Segmento</Label>
            <select
              id="company-segment"
              value={segment}
              onChange={(e) => { setSegment(e.target.value); setTouched(true); }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione…</option>
              {SEGMENTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
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
            disabled={!dirty || saving}
            className="w-full bg-gradient-primary shadow-elegant rounded-xl"
          >
            {saving ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      )}
    </div>
  );
}
