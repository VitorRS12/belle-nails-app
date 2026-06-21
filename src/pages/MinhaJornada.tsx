import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfessionalSchedules, WEEKDAYS } from "@/hooks/useProfessionalSchedules";
import { useProfessionalDayBlocks } from "@/hooks/useProfessionalDayBlocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Plus, X, CalendarDays, Ban } from "lucide-react";
import { ListSkeleton } from "@/components/ListSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type Me = { id: string; company_id: string; name: string } | null;

const MinhaJornada = () => {
  const { user } = useAuth();
  const [me, setMe] = useState<Me>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("professionals")
        .select("id, company_id, name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!active) return;
      setMe(data as Me);
      setLoadingMe(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  return (
    <AppLayout subtitle="Minha conta" title="Minha jornada">
      {loadingMe ? (
        <ListSkeleton rows={4} />
      ) : !me ? (
        <EmptyState
          icon={<CalendarDays className="h-5 w-5" />}
          title="Perfil profissional não encontrado"
          description="Peça à empresa para vincular o seu cadastro como profissional para configurar a jornada."
        />
      ) : (
        <Editor professionalId={me.id} companyId={me.company_id} name={me.name} />
      )}
    </AppLayout>
  );
};

function Editor({
  professionalId,
  companyId,
  name,
}: {
  professionalId: string;
  companyId: string;
  name: string;
}) {
  const { schedules, loading, add, remove } = useProfessionalSchedules(professionalId);
  const [weekday, setWeekday] = useState("1");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (end <= start) {
      toast.error("Hora final deve ser maior que a inicial");
      return;
    }
    setSaving(true);
    const ok = await add(companyId, Number(weekday), `${start}:00`, `${end}:00`);
    setSaving(false);
    if (ok) toast.success("Bloco adicionado");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card border border-border/60 p-4 shadow-soft">
        <p className="text-xs text-muted-foreground">Profissional</p>
        <p className="font-display text-lg">{name}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Defina os dias e horários em que você atende. O site público usa esta jornada para
          mostrar os horários disponíveis aos clientes.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-accent-soft/30 p-4 space-y-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" /> Adicionar bloco de atendimento
        </div>
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Dia</Label>
            <Select value={weekday} onValueChange={setWeekday}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEEKDAYS.map((label, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Início</Label>
            <Input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="h-9 w-[100px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fim</Label>
            <Input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="h-9 w-[100px]"
            />
          </div>
          <Button size="icon" onClick={handleAdd} disabled={saving} className="h-9 w-9">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <ListSkeleton rows={2} />
      ) : schedules.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhuma jornada definida ainda.
        </p>
      ) : (
        <ul className="space-y-2">
          {schedules.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-3 py-2 shadow-soft"
            >
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="font-medium">
                  {WEEKDAYS[s.weekday]}
                </Badge>
                <span className="text-sm tabular-nums">
                  {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                </span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => remove(s.id)}
                aria-label="Remover"
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MinhaJornada;
