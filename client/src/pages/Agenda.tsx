import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/StatusBadge";
import {
  TRILHA_COLORS,
  trilhaLabel,
  prioridadeLabel,
  PRIORIDADE_STYLES,
} from "@/lib/domain";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Video,
  ChevronRight as ArrowRight,
} from "lucide-react";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

type AgendaItem = {
  id: number;
  titulo: string;
  trilha: string;
  etapa: string;
  prioridade: string | null;
  status: string;
  portaVoz: string | null;
  formatoProducao: string | null;
  dataAgendada: Date | null;
};

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function Agenda() {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const ano = cursor.getFullYear();
  const mes = cursor.getMonth() + 1; // 1-12

  const { data, isLoading, isError } = trpc.contents.agendaMes.useQuery({
    ano,
    mes,
  });

  // Agrupa itens por dia do mês.
  const byDay = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    (data ?? []).forEach((item) => {
      if (!item.dataAgendada) return;
      const d = new Date(item.dataAgendada);
      const key = dayKey(d);
      const arr = map.get(key) ?? [];
      arr.push(item as AgendaItem);
      map.set(key, arr);
    });
    return map;
  }, [data]);

  const totalMes = data?.length ?? 0;

  // Monta a grade do calendário (6 semanas x 7 dias).
  const grid = useMemo(() => {
    const firstDay = new Date(ano, mes - 1, 1);
    const startWeekday = firstDay.getDay(); // 0 = domingo
    const cells: { date: Date; inMonth: boolean }[] = [];
    // Dias do mês anterior para preencher a primeira semana.
    for (let i = startWeekday - 1; i >= 0; i--) {
      cells.push({
        date: new Date(ano, mes - 1, -i),
        inMonth: false,
      });
    }
    const daysInMonth = new Date(ano, mes, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(ano, mes - 1, d), inMonth: true });
    }
    // Completa até múltiplo de 7.
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      cells.push({
        date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
        inMonth: false,
      });
    }
    return cells;
  }, [ano, mes]);

  function goPrev() {
    setCursor(new Date(ano, mes - 2, 1));
  }
  function goNext() {
    setCursor(new Date(ano, mes, 1));
  }
  function goToday() {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  const selectedItems = selectedDay
    ? byDay.get(dayKey(selectedDay)) ?? []
    : [];

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-[oklch(0.64_0.27_350)]" />
            Agenda de Gravações
          </h1>
          <p className="text-muted-foreground mt-1">
            Cronograma mensal — clique em um dia para ver o que será gravado.
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-sm px-3 py-1.5 bg-card font-medium"
        >
          {totalMes} {totalMes === 1 ? "gravação" : "gravações"} em{" "}
          {MESES[mes - 1]}
        </Badge>
      </div>

      <Card className="p-4 md:p-6">
        {/* Cabeçalho de navegação do mês */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="icon" onClick={goPrev} className="bg-card">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight">
              {MESES[mes - 1]} {ano}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToday}
              className="text-xs h-7"
            >
              Hoje
            </Button>
          </div>
          <Button variant="outline" size="icon" onClick={goNext} className="bg-card">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="text-center text-xs font-semibold text-muted-foreground py-1"
            >
              {w}
            </div>
          ))}
        </div>

        {isError ? (
          <div className="py-16 text-center text-muted-foreground">
            Não foi possível carregar a agenda. Tente recarregar a página.
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5">
            {grid.map(({ date, inMonth }, idx) => {
              const items = byDay.get(dayKey(date)) ?? [];
              const count = items.length;
              const isToday = dayKey(date) === dayKey(today);
              const trilhasNoDia = Array.from(
                new Set(items.map((i) => i.trilha)),
              );
              return (
                <button
                  key={idx}
                  onClick={() => count > 0 && setSelectedDay(date)}
                  disabled={count === 0}
                  className={[
                    "min-h-24 rounded-lg border p-2 text-left transition-all flex flex-col gap-1",
                    inMonth ? "bg-card" : "bg-muted/30",
                    count > 0
                      ? "border-[oklch(0.64_0.27_350)]/30 hover:border-[oklch(0.64_0.27_350)] hover:shadow-md cursor-pointer active:scale-[0.98]"
                      : "border-border cursor-default",
                    isToday ? "ring-2 ring-[oklch(0.27_0.06_254)]/40" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={[
                        "text-sm font-semibold",
                        inMonth ? "text-foreground" : "text-muted-foreground/50",
                        isToday
                          ? "flex h-6 w-6 items-center justify-center rounded-full bg-[oklch(0.27_0.06_254)] text-white"
                          : "",
                      ].join(" ")}
                    >
                      {date.getDate()}
                    </span>
                    {count > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.64_0.27_350)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                        <Video className="h-2.5 w-2.5" />
                        {count}
                      </span>
                    )}
                  </div>
                  {count > 0 && (
                    <div className="mt-auto flex flex-wrap gap-1">
                      {trilhasNoDia.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: TRILHA_COLORS[t] ?? "#94a3b8" }}
                          title={trilhaLabel(t)}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Painel lateral com o que será gravado no dia */}
      <DaySheet
        day={selectedDay}
        items={selectedItems}
        onClose={() => setSelectedDay(null)}
      />
    </div>
  );
}

function DaySheet({
  day,
  items,
  onClose,
}: {
  day: Date | null;
  items: AgendaItem[];
  onClose: () => void;
}) {
  const [, setLocation] = useLocation();
  return (
    <Sheet open={!!day} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[oklch(0.64_0.27_350)]" />
            {day
              ? day.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : ""}
          </SheetTitle>
          <SheetDescription>
            {items.length} {items.length === 1 ? "gravação marcada" : "gravações marcadas"}{" "}
            para este dia.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setLocation(`/conteudos/${item.id}`)}
              className="w-full text-left rounded-xl border bg-card p-3 hover:shadow-md hover:border-[oklch(0.64_0.27_350)]/40 transition-all active:scale-[0.99] group"
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge
                  className="text-white border-0 text-[11px]"
                  style={{
                    backgroundColor: TRILHA_COLORS[item.trilha] ?? "#64748b",
                  }}
                >
                  {trilhaLabel(item.trilha)}
                </Badge>
                <StatusBadge status={item.status} />
                {item.prioridade && (
                  <span
                    className={[
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                      PRIORIDADE_STYLES[item.prioridade] ?? "",
                    ].join(" ")}
                  >
                    {prioridadeLabel(item.prioridade)}
                  </span>
                )}
              </div>
              <p className="font-medium leading-snug text-foreground">
                {item.titulo}
              </p>
              <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span className="truncate">
                  {item.portaVoz ? `Porta-voz: ${item.portaVoz}` : item.etapa}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
