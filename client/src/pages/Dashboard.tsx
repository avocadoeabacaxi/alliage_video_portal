import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  STATUS_COLORS,
  STATUS_FLOW,
  TRILHA_COLORS,
  TRILHA_LABELS,
  trilhaLabel,
} from "@/lib/domain";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  CheckCircle2,
  Clapperboard,
  Film,
  ListChecks,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const PRIORIDADE_COLORS: Record<string, string> = {
  Alta: "#e11d48",
  Media: "#0ea5e9",
  Baixa: "#a1a1aa",
};
const ETAPA_COLORS = ["#1e3a8a", "#7c3aed", "#db2777", "#ea580c"];

export default function Dashboard() {
  const { data: stats, isLoading, isError, refetch } =
    trpc.contents.stats.useQuery();

  const derived = useMemo(() => {
    if (!stats) return null;
    const total = stats.total;
    const concluido =
      stats.byStatus.find((s) => s.key === "Publicado")?.count ?? 0;
    const aGravar =
      stats.byStatus.find((s) => s.key === "A gravar")?.count ?? 0;
    const gravados = total - aGravar;
    const emProducao = total - aGravar - concluido;

    // Por trilha: gravados (qualquer status != A gravar) x pendentes
    const trilhaMap: Record<string, { gravados: number; pendentes: number }> =
      {};
    for (const r of stats.byTrilhaStatus ?? []) {
      if (!trilhaMap[r.trilha])
        trilhaMap[r.trilha] = { gravados: 0, pendentes: 0 };
      if (r.status === "A gravar") trilhaMap[r.trilha].pendentes += r.count;
      else trilhaMap[r.trilha].gravados += r.count;
    }
    const byTrilha = Object.keys(TRILHA_LABELS)
      .filter((t) => trilhaMap[t])
      .map((t) => ({
        trilha: trilhaLabel(t),
        Gravados: trilhaMap[t].gravados,
        Pendentes: trilhaMap[t].pendentes,
      }));

    // Por trimestre
    const triMap: Record<string, { gravados: number; pendentes: number }> = {};
    for (const r of stats.byTrimestreStatus ?? []) {
      const key = r.trimestre ?? "—";
      if (!triMap[key]) triMap[key] = { gravados: 0, pendentes: 0 };
      if (r.status === "A gravar") triMap[key].pendentes += r.count;
      else triMap[key].gravados += r.count;
    }
    const byTrimestre = Object.keys(triMap)
      .sort()
      .map((k) => ({
        trimestre: k.replace(" - ", "\n"),
        Gravados: triMap[k].gravados,
        Pendentes: triMap[k].pendentes,
      }));

    const statusData = STATUS_FLOW.map((s) => ({
      name: s,
      value: stats.byStatus.find((x) => x.key === s)?.count ?? 0,
    }));

    return {
      total,
      concluido,
      aGravar,
      gravados,
      emProducao,
      byTrilha,
      byTrimestre,
      statusData,
      pct: total ? Math.round((gravados / total) * 1000) / 10 : 0,
      pctPublicado: total ? Math.round((concluido / total) * 1000) / 10 : 0,
    };
  }, [stats]);

  if (isError) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-3">
        <p className="text-foreground font-medium">
          Não foi possível carregar o painel.
        </p>
        <p className="text-sm text-muted-foreground">
          Verifique sua conexão e tente novamente.
        </p>
        <button
          onClick={() => refetch()}
          className="text-sm font-semibold text-[oklch(0.64_0.27_350)] underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (isLoading || !derived) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const kpis = [
    {
      label: "Total de conteúdos",
      value: derived.total,
      icon: ListChecks,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Gravados",
      value: derived.gravados,
      icon: Clapperboard,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "Em produção",
      value: derived.emProducao,
      icon: Film,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      label: "Publicados",
      value: derived.concluido,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Evolução da Captação
        </h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe o progresso das gravações das 5 trilhas Alliage Experience.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="overflow-hidden">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{k.label}</p>
                <p className="text-3xl font-bold mt-1 text-foreground">
                  {k.value}
                </p>
              </div>
              <div
                className={`h-12 w-12 rounded-xl flex items-center justify-center ${k.bg}`}
              >
                <k.icon className={`h-6 w-6 ${k.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progresso geral */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-[oklch(0.64_0.27_350)]" />
            Progresso geral
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">
                Gravados (saíram de "A gravar")
              </span>
              <span className="font-semibold">{derived.pct}%</span>
            </div>
            <Progress
              value={derived.pct > 0 ? Math.max(derived.pct, 1.5) : 0}
              className="h-2.5"
            />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">Publicados</span>
              <span className="font-semibold">{derived.pctPublicado}%</span>
            </div>
            <Progress
              value={
                derived.pctPublicado > 0 ? Math.max(derived.pctPublicado, 1.5) : 0
              }
              className="h-2.5"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por trilha */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Gravados x Pendentes por trilha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={derived.byTrilha} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="trilha"
                  width={110}
                  fontSize={12}
                />
                <Tooltip />
                <Legend />
                <Bar dataKey="Gravados" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Pendentes" stackId="a" fill="#cbd5e1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Por status (pizza) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribuição por status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={derived.statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={55}
                  paddingAngle={2}
                  label={(e: any) => (e.value > 0 ? e.value : "")}
                >
                  {derived.statusData.map((d) => (
                    <Cell key={d.name} fill={STATUS_COLORS[d.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Por trimestre */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolução por trimestre</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={derived.byTrimestre}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="trimestre" fontSize={11} interval={0} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Gravados" stackId="a" fill="#db2777" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Pendentes" stackId="a" fill="#fbcfe8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Por etapa e prioridade */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Por etapa e prioridade</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={(stats?.byEtapa ?? []).map((e) => ({
                    name: e.key,
                    value: e.count,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  label={(e: any) => e.name}
                  labelLine={false}
                  fontSize={10}
                >
                  {(stats?.byEtapa ?? []).map((_, i) => (
                    <Cell key={i} fill={ETAPA_COLORS[i % ETAPA_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={(stats?.byPrioridade ?? []).map((p) => ({
                  name: p.key,
                  value: p.count,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {(stats?.byPrioridade ?? []).map((p, i) => (
                    <Cell
                      key={i}
                      fill={PRIORIDADE_COLORS[p.key ?? ""] ?? "#94a3b8"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ranking */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-amber-500" />
            Ranking de gravações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats && stats.ranking.length > 0 ? (
            <div className="space-y-2">
              {stats.ranking.map((r, i) => {
                const max = stats.ranking[0].count || 1;
                return (
                  <div key={r.nome} className="flex items-center gap-3">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        i === 0
                          ? "bg-amber-400 text-white"
                          : i === 1
                            ? "bg-slate-300 text-slate-700"
                            : i === 2
                              ? "bg-amber-700 text-white"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium w-40 truncate">
                      {r.nome}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[oklch(0.32_0.07_254)] to-[oklch(0.64_0.27_350)] rounded-full transition-all"
                        style={{ width: `${(r.count / max) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-10 text-right">
                      {r.count}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Ainda não há gravações registradas. Quando a equipe começar a
              marcar conteúdos como "Gravado", o ranking aparecerá aqui.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
