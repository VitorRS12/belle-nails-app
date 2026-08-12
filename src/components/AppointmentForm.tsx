import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { appointmentsStore, clientsStore, uid } from "@/lib/storage";
import { useClients } from "@/hooks/useStore";
import { useProfile } from "@/hooks/useProfile";
import { useCustomServices } from "@/hooks/useCustomServices";
import { useProfessionals } from "@/hooks/useProfessionals";
import { type Appointment, type Material, type ServiceItem, SERVICE_CATALOG_BY_AREA, AREAS, type AreaKey } from "@/lib/types";
import { Plus, X, Star } from "lucide-react";
import { toast } from "sonner";
import { useTrialStatus } from "@/features/billing/hooks/useTrialStatus";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  trigger?: React.ReactNode;
  initial?: Appointment;
  defaultDate?: string;
  onSaved?: () => void;
}

function initialServices(initial?: Appointment): ServiceItem[] {
  if (initial?.services && initial.services.length > 0) return initial.services;
  if (initial?.service) {
    // legacy single-service record
    return [{ name: initial.service, price: initial.price || 0 }];
  }
  return [];
}

export function AppointmentForm({ trigger, initial, defaultDate, onSaved }: Props) {
  const { t } = useTranslation("common");
  const clients = useClients();
  const { isReadOnly } = useTrialStatus();
  const { profile } = useProfile();
  const { services: customCatalog, add: addCustomService } = useCustomServices();
  const { professionals } = useProfessionals();
  const { user } = useAuth();
  // The professional linked to the signed-in account, used as the default so
  // every appointment is attributed to whoever created it.
  const myProfessionalId = useMemo(
    () => professionals.find((p) => p.user_id && p.user_id === user?.id)?.id ?? "",
    [professionals, user?.id]
  );
  const activeProfessionals = useMemo(
    () => professionals.filter((p) => p.active),
    [professionals]
  );
  const activeAreas: AreaKey[] = [profile?.area ?? "manicure"];
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [newClientName, setNewClientName] = useState("");
  const [date, setDate] = useState(initial?.date ?? defaultDate ?? new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(initial?.time ?? "09:00");
  const [professionalId, setProfessionalId] = useState<string>(initial?.professionalId ?? "");

  const [services, setServices] = useState<ServiceItem[]>(initialServices(initial));
  const [pickerValue, setPickerValue] = useState<string>("");
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customArea, setCustomArea] = useState<AreaKey>(activeAreas[0] ?? "manicure");

  const [materials, setMaterials] = useState<Material[]>(initial?.materials ?? []);
  const [matName, setMatName] = useState("");
  const [matQty, setMatQty] = useState("");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [status, setStatus] = useState<Appointment["status"]>(initial?.status ?? "scheduled");

  useEffect(() => {
    if (!open) return;
    setClientId(initial?.clientId ?? "");
    setDate(initial?.date ?? defaultDate ?? new Date().toISOString().slice(0, 10));
    setTime(initial?.time ?? "09:00");
    setServices(initialServices(initial));
    setPickerValue("");
    setCustomName("");
    setMaterials(initial?.materials ?? []);
    setNotes(initial?.notes ?? "");
    setStatus(initial?.status ?? "scheduled");
    setProfessionalId(
      initial?.professionalId ||
        myProfessionalId ||
        (activeProfessionals.length === 1 ? activeProfessionals[0].id : "")
    );
  }, [open, initial, defaultDate, activeProfessionals, myProfessionalId]);

  const total = useMemo(
    () => services.reduce((s, x) => s + (Number(x.price) || 0), 0),
    [services],
  );

  const addFromCatalog = (value: string) => {
    // value format: "default::<area>::<name>" or "custom::<id>"
    if (value.startsWith("custom::")) {
      const id = value.slice("custom::".length);
      const found = customCatalog.find((s) => s.id === id);
      if (!found) return;
      setServices((cur) => [...cur, { name: found.name, price: found.price }]);
      setPickerValue("");
      return;
    }
    const [, area, name] = value.split("::");
    const list = SERVICE_CATALOG_BY_AREA[area as AreaKey] ?? [];
    const found = list.find((s) => s.name === name);
    if (!found) return;
    setServices((cur) => [...cur, { name: found.name, price: found.price }]);
    setPickerValue("");
  };

  const addCustom = async () => {
    const n = customName.trim();
    if (!n) {
      toast.error(t("appointmentForm.errors.customServiceName"));
      return;
    }
    const price = Number(customPrice.replace(",", ".")) || 0;
    // Persist for next time
    const saved = await addCustomService(customArea, n, price);
    // Add to current appointment regardless of save success
    setServices((cur) => [...cur, { name: saved?.name ?? n, price: saved?.price ?? price }]);
    setCustomName("");
    setCustomPrice("");
    if (saved) toast.success(t("appointmentForm.customServiceSaved"));
  };

  const updateService = (idx: number, patch: Partial<ServiceItem>) => {
    setServices((cur) => cur.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const removeService = (idx: number) => {
    setServices((cur) => cur.filter((_, i) => i !== idx));
  };

  const addMaterial = () => {
    if (!matName.trim()) return;
    setMaterials((m) => [...m, { name: matName.trim(), quantity: matQty.trim() || undefined }]);
    setMatName("");
    setMatQty("");
  };

  const submit = () => {
    if (isReadOnly) {
      return toast.error(t("appointmentForm.readOnlyError"));
    }
    let finalClientId = clientId;
    let finalClientName = clients.find((c) => c.id === clientId)?.name ?? "";

    if (!finalClientId && newClientName.trim()) {
      const c = { id: uid(), name: newClientName.trim(), createdAt: new Date().toISOString() };
      clientsStore.save(c);
      finalClientId = c.id;
      finalClientName = c.name;
    }

    if (!finalClientId) return toast.error(t("appointmentForm.errors.selectOrCreateClient"));
    if (services.length === 0) return toast.error(t("appointmentForm.errors.addService"));

    const cleanServices = services.map((s) => ({
      name: s.name.trim() || t("appointmentForm.services"),
      price: Number(s.price) || 0,
    }));
    const totalPrice = cleanServices.reduce((s, x) => s + x.price, 0);
    const serviceLabel = cleanServices.map((s) => s.name).join(" + ");

    const appt: Appointment = {
      id: initial?.id ?? uid(),
      clientId: finalClientId,
      clientName: finalClientName,
      date,
      time,
      service: serviceLabel,
      services: cleanServices,
      materials,
      price: totalPrice,
      notes: notes.trim() || undefined,
      status,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      professionalId: professionalId || undefined,
    };
    appointmentsStore.save(appt);
    toast.success(initial ? t("appointmentForm.saved.updated") : t("appointmentForm.saved.created"));
    setOpen(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="icon" className="h-11 w-11 rounded-full bg-gradient-primary shadow-elegant hover:opacity-90">
            <Plus className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {initial ? t("appointmentForm.title.edit") : t("appointmentForm.title.new")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>{t("appointmentForm.client")}</Label>
            {clients.length > 0 ? (
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder={t("appointmentForm.selectClient")} /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            {!clientId && (
              <Input
                placeholder={clients.length ? t("appointmentForm.newClientPlaceholder") : t("appointmentForm.newClientNameOnlyPlaceholder")}
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("appointmentForm.date")}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("appointmentForm.time")}</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          {activeProfessionals.length > 1 && (
            <div className="space-y-2">
              <Label>{t("appointmentForm.professional")}</Label>
              <Select value={professionalId} onValueChange={setProfessionalId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("appointmentForm.selectProfessional")} />
                </SelectTrigger>
                <SelectContent>
                  {activeProfessionals.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-3">
            <Label>{t("appointmentForm.services")}</Label>

            <Select value={pickerValue} onValueChange={addFromCatalog}>
              <SelectTrigger><SelectValue placeholder={t("appointmentForm.addFromList")} /></SelectTrigger>
              <SelectContent>
                {customCatalog.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>{t("appointmentForm.myServices")}</SelectLabel>
                    {customCatalog.map((s) => (
                      <SelectItem key={`custom::${s.id}`} value={`custom::${s.id}`}>
                        {s.name} · R$ {s.price.toFixed(2).replace(".", ",")}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {activeAreas.map((areaKey) => {
                  const area = AREAS.find((a) => a.key === areaKey);
                  const items = SERVICE_CATALOG_BY_AREA[areaKey] ?? [];
                  if (!area || items.length === 0) return null;
                  return (
                    <SelectGroup key={areaKey}>
                      <SelectLabel>{area.emoji} {area.label}</SelectLabel>
                      {items.map((s) => (
                        <SelectItem key={`default::${areaKey}::${s.name}`} value={`default::${areaKey}::${s.name}`}>
                          {s.name} · R$ {s.price.toFixed(2).replace(".", ",")}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  );
                })}
              </SelectContent>
            </Select>

            <div className="rounded-2xl border border-dashed border-border bg-accent-soft/30 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Star className="h-3 w-3" />
                {t("appointmentForm.customServiceHint")}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={t("appointmentForm.customServiceNamePlaceholder")}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
                />
                <Input
                  className="w-24"
                  inputMode="decimal"
                  placeholder={t("appointmentForm.customServicePricePlaceholder")}
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
                />
              </div>
              {activeAreas.length > 1 && (
                <Select value={customArea} onValueChange={(v) => setCustomArea(v as AreaKey)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {activeAreas.map((areaKey) => {
                      const area = AREAS.find((a) => a.key === areaKey);
                      if (!area) return null;
                      return (
                        <SelectItem key={areaKey} value={areaKey}>
                          {area.emoji} {area.label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
              <Button type="button" variant="secondary" onClick={addCustom} className="w-full h-9">
                <Plus className="h-4 w-4 mr-1" /> {t("appointmentForm.addAndSave")}
              </Button>
            </div>

            {services.length > 0 && (
              <div className="space-y-2">
                {services.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl bg-accent-soft/50 p-2">
                    <Input
                      className="flex-1 h-9 bg-background"
                      value={s.name}
                      onChange={(e) => updateService(i, { name: e.target.value })}
                    />
                    <Input
                      className="w-24 h-9 bg-background"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={s.price === 0 ? "" : String(s.price)}
                      onChange={(e) =>
                        updateService(i, { price: Number(e.target.value.replace(",", ".")) || 0 })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeService(i)}
                      className="h-8 w-8 rounded-full bg-secondary hover:bg-destructive/10 hover:text-destructive inline-flex items-center justify-center transition-smooth"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <div className="flex items-center justify-between rounded-2xl bg-gradient-soft p-3">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">{t("appointmentForm.total")}</span>
                  <span className="font-display text-xl text-primary">
                    R$ {total.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("appointmentForm.materials")}</Label>
            <div className="flex gap-2">
              <Input
                placeholder={t("appointmentForm.materialNamePlaceholder")}
                value={matName}
                onChange={(e) => setMatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMaterial())}
              />
              <Input
                className="w-24"
                placeholder={t("appointmentForm.materialQtyPlaceholder")}
                value={matQty}
                onChange={(e) => setMatQty(e.target.value)}
              />
              <Button type="button" variant="secondary" onClick={addMaterial}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {materials.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {materials.map((m, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs text-foreground"
                  >
                    {m.quantity ? t("appointmentForm.materialQuantity", { name: m.name, quantity: m.quantity }) : m.name}
                    <button onClick={() => setMaterials((mm) => mm.filter((_, idx) => idx !== i))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("appointmentForm.notes")}</Label>
            <Textarea
              placeholder={t("appointmentForm.notesPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {initial?.status === "completed" || initial?.status === "cancelled" ? (
            <div className="space-y-2">
              <Label>{t("appointmentForm.status")}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Appointment["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">{t("appointmentForm.statusOptions.scheduled")}</SelectItem>
                  <SelectItem value="completed">{t("appointmentForm.statusOptions.completed")}</SelectItem>
                  <SelectItem value="cancelled">{t("appointmentForm.statusOptions.cancelled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <Button onClick={submit} className="w-full bg-gradient-primary shadow-elegant h-11 text-base">
            {t("appointmentForm.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
