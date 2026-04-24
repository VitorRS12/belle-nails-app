import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAppointments } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDown, TrendingUp, Trophy, Crown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

const Relatorio = () => {
  const appts = useAppointments();
  const now = new Date();
  const [month, setMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  const stats = useMemo(() => {
    const monthAppts = appts.filter(
      (a) => a.date.startsWith(month) && a.status === "completed"
    );
    const revenue = monthAppts.reduce((s, a) => s + a.price, 0);

    // Most performed service
    const serviceCount = new Map<string, number>();
    monthAppts.forEach((a) => {
      serviceCount.set(a.service, (serviceCount.get(a.service) ?? 0) + 1);
    });
    const topService = Array.from(serviceCount.entries()).sort((a, b) => b[1] - a[1])[0];

    // Top client for that top service
    let topClientForService: { name: string; count: number } | null = null;
    if (topService) {
      const clientCount = new Map<string, number>();
      monthAppts
        .filter((a) => a.service === topService[0])
        .forEach((a) => {
          clientCount.set(a.clientName, (clientCount.get(a.clientName) ?? 0) + 1);
        });
      const top = Array.from(clientCount.entries()).sort((a, b) => b[1] - a[1])[0];
      if (top) topClientForService = { name: top[0], count: top[1] };
    }

    return {
      appts: monthAppts.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
      revenue,
      topService: topService ? { name: topService[0], count: topService[1] } : null,
      topClientForService,
    };
  }, [appts, month]);

  const monthLabel = format(parseISO(`${month}-01`), "MMMM 'de' yyyy", { locale: ptBR });

  const generatePDF = () => {
    if (stats.appts.length === 0) {
      return toast.error("Nenhum atendimento concluído neste mês.");
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header bar
    doc.setFillColor(199, 96, 120); // primary-ish rose
    doc.rect(0, 0, pageWidth, 32, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Belle Nails", 14, 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Relatório mensal", 14, 22);
    doc.setFontSize(10);
    doc.text(monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1), pageWidth - 14, 22, { align: "right" });

    // Summary cards
    doc.setTextColor(60, 30, 40);
    let y = 44;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Resumo do mês", 14, y);
    y += 6;

    doc.setDrawColor(230, 215, 220);
    doc.setFillColor(252, 246, 248);

    const cardW = (pageWidth - 28 - 8) / 2;
    // Faturamento
    doc.roundedRect(14, y, cardW, 24, 3, 3, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 90, 100);
    doc.text("FATURAMENTO", 18, y + 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(199, 96, 120);
    doc.text(`R$ ${stats.revenue.toFixed(2).replace(".", ",")}`, 18, y + 17);

    // Atendimentos
    doc.setFillColor(252, 246, 248);
    doc.roundedRect(14 + cardW + 8, y, cardW, 24, 3, 3, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 90, 100);
    doc.text("ATENDIMENTOS", 14 + cardW + 12, y + 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(199, 96, 120);
    doc.text(String(stats.appts.length), 14 + cardW + 12, y + 17);

    y += 32;

    // Highlights
    doc.setTextColor(60, 30, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Destaques", 14, y);
    y += 4;

    if (stats.topService) {
      y += 6;
      doc.setFillColor(248, 240, 224);
      doc.roundedRect(14, y, pageWidth - 28, 14, 3, 3, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(140, 100, 50);
      doc.text("SERVIÇO MAIS REALIZADO", 18, y + 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(60, 30, 40);
      doc.text(
        `${stats.topService.name}  ·  ${stats.topService.count}x`,
        18,
        y + 11
      );
      y += 16;
    }

    if (stats.topClientForService) {
      doc.setFillColor(248, 240, 224);
      doc.roundedRect(14, y, pageWidth - 28, 14, 3, 3, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(140, 100, 50);
      doc.text("CLIENTE QUE MAIS REALIZOU ESSE SERVIÇO", 18, y + 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(60, 30, 40);
      doc.text(
        `${stats.topClientForService.name}  ·  ${stats.topClientForService.count}x`,
        18,
        y + 11
      );
      y += 18;
    }

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(60, 30, 40);
    doc.text("Serviços realizados", 14, y);

    autoTable(doc, {
      startY: y + 4,
      head: [["Data", "Hora", "Cliente", "Serviço", "Valor"]],
      body: stats.appts.map((a) => [
        format(parseISO(a.date), "dd/MM"),
        a.time,
        a.clientName,
        a.service,
        `R$ ${a.price.toFixed(2).replace(".", ",")}`,
      ]),
      foot: [["", "", "", "Total", `R$ ${stats.revenue.toFixed(2).replace(".", ",")}`]],
      headStyles: { fillColor: [199, 96, 120], textColor: 255, fontStyle: "bold" },
      footStyles: { fillColor: [248, 240, 224], textColor: [60, 30, 40], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [252, 246, 248] },
      styles: { font: "helvetica", fontSize: 10, cellPadding: 3 },
      margin: { left: 14, right: 14 },
    });

    doc.save(`belle-nails-${month}.pdf`);
    toast.success("PDF gerado!");
  };

  return (
    <AppLayout subtitle="Resumo mensal" title="Relatório">
      <div className="rounded-2xl bg-card border border-border/60 p-4 shadow-soft space-y-3">
        <div className="space-y-2">
          <Label>Selecione o mês</Label>
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gradient-primary text-primary-foreground p-4 shadow-elegant">
          <TrendingUp className="h-5 w-5 mb-3 opacity-90" />
          <p className="text-xs uppercase tracking-wider opacity-80">Faturamento</p>
          <p className="font-display text-2xl mt-1">
            R$ {stats.revenue.toFixed(2).replace(".", ",")}
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-gold text-accent-foreground p-4 shadow-gold">
          <Trophy className="h-5 w-5 mb-3 opacity-90" />
          <p className="text-xs uppercase tracking-wider opacity-80">Atendimentos</p>
          <p className="font-display text-2xl mt-1">{stats.appts.length}</p>
        </div>
      </section>

      {stats.topService && (
        <div className="rounded-2xl bg-card border border-border/60 p-4 shadow-soft">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
            <Trophy className="h-3 w-3" /> Serviço mais realizado
          </p>
          <p className="font-display text-xl mt-1">{stats.topService.name}</p>
          <p className="text-sm text-muted-foreground">{stats.topService.count}x no mês</p>
        </div>
      )}

      {stats.topClientForService && (
        <div className="rounded-2xl bg-card border border-border/60 p-4 shadow-soft">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
            <Crown className="h-3 w-3" /> Cliente que mais fez esse serviço
          </p>
          <p className="font-display text-xl mt-1">{stats.topClientForService.name}</p>
          <p className="text-sm text-muted-foreground">
            {stats.topClientForService.count}x · {stats.topService?.name}
          </p>
        </div>
      )}

      <Button
        onClick={generatePDF}
        className="w-full h-12 bg-gradient-primary shadow-elegant text-base"
      >
        <FileDown className="h-5 w-5 mr-2" /> Gerar PDF do mês
      </Button>
    </AppLayout>
  );
};

export default Relatorio;
