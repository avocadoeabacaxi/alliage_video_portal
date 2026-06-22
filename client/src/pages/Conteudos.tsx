import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ETAPAS,
  PRIORIDADES,
  PRIORIDADE_LABELS,
  PRIORIDADE_STYLES,
  STATUS_FLOW,
  TRILHAS,
  TRILHA_LABELS,
  TRIMESTRES,
  trilhaLabel,
} from "@/lib/domain";
import { StatusBadge } from "@/components/StatusBadge";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ALL = "__all__";
const PAGE_SIZE = 20;

export default function Conteudos() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [trilha, setTrilha] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [prioridade, setPrioridade] = useState(ALL);
  const [trimestre, setTrimestre] = useState(ALL);
  const [responsavel, setResponsavel] = useState(ALL);

  // Quantos itens estão visíveis no momento (cresce de 20 em 20).
  const [visible, setVisible] = useState(PAGE_SIZE);

  const baseFilters = useMemo(
    () => ({
      search: search.trim() || undefined,
      trilha: trilha === ALL ? undefined : trilha,
      status: status === ALL ? undefined : status,
      prioridade: prioridade === ALL ? undefined : prioridade,
      trimestre: trimestre === ALL ? undefined : trimestre,
      responsavel: responsavel === ALL ? undefined : responsavel,
    }),
    [search, trilha, status, prioridade, trimestre, responsavel],
  );

  // Sempre que os filtros mudam, volta para a primeira "página".
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [baseFilters]);

  const filters = useMemo(
    () => ({ ...baseFilters, limit: visible, offset: 0 }),
    [baseFilters, visible],
  );

  const { data, isLoading, isFetching, isError } =
    trpc.contents.list.useQuery(filters);
  const { data: responsaveis } = trpc.contents.responsaveis.useQuery();

  const contents = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasMore = contents.length < total;

  const hasFilter =
    trilha !== ALL ||
    status !== ALL ||
    prioridade !== ALL ||
    trimestre !== ALL ||
    responsavel !== ALL ||
    search.trim() !== "";

  function clearFilters() {
    setSearch("");
    setTrilha(ALL);
    setStatus(ALL);
    setPrioridade(ALL);
    setTrimestre(ALL);
    setResponsavel(ALL);
  }

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Conteúdos
          </h1>
          <p className="text-muted-foreground mt-1">
            {data
              ? `Mostrando ${contents.length} de ${total} conteúdos`
              : "Carregando..."}{" "}
            • filtre, busque e abra a ficha para gerenciar a produção.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto h-7 text-xs text-[oklch(0.64_0.27_350)]"
            >
              <X className="h-3 w-3 mr-1" /> Limpar
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <FilterSelect
            value={trilha}
            onChange={setTrilha}
            placeholder="Trilha"
            options={TRILHAS.map((t) => ({ value: t, label: TRILHA_LABELS[t] }))}
          />
          <FilterSelect
            value={status}
            onChange={setStatus}
            placeholder="Status"
            options={STATUS_FLOW.map((s) => ({ value: s, label: s }))}
          />
          <FilterSelect
            value={prioridade}
            onChange={setPrioridade}
            placeholder="Prioridade"
            options={PRIORIDADES.map((p) => ({
              value: p,
              label: PRIORIDADE_LABELS[p],
            }))}
          />
          <FilterSelect
            value={trimestre}
            onChange={setTrimestre}
            placeholder="Trimestre"
            options={TRIMESTRES.map((t) => ({ value: t, label: t }))}
          />
          <FilterSelect
            value={responsavel}
            onChange={setResponsavel}
            placeholder="Responsável"
            options={(responsaveis ?? []).map((r) => ({ value: r, label: r }))}
            className="xl:col-span-1"
          />
        </div>
      </Card>

      {/* Lista */}
      {isError ? (
        <Card className="p-12 text-center text-muted-foreground">
          Não foi possível carregar os conteúdos. Tente recarregar a página.
        </Card>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : contents.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          Nenhum conteúdo encontrado com os filtros selecionados.
        </Card>
      ) : (
        <div className="space-y-2">
          {contents.map((c) => (
            <button
              key={c.id}
              onClick={() => setLocation(`/conteudos/${c.id}`)}
              className="w-full text-left group"
            >
              <Card className="p-4 transition-all hover:shadow-md hover:border-[oklch(0.64_0.27_350)]/40 group-active:scale-[0.997]">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center justify-center w-12 shrink-0">
                    <span className="text-xs text-muted-foreground">#</span>
                    <span className="text-sm font-bold text-primary">
                      {c.ordem}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <Badge
                        variant="outline"
                        className="text-xs bg-primary/5 border-primary/20 text-primary"
                      >
                        {trilhaLabel(c.trilha)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {c.etapa}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {c.bloco}
                      </span>
                    </div>
                    <p className="font-medium text-foreground line-clamp-2 leading-snug">
                      {c.titulo}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {c.prioridade && (
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${PRIORIDADE_STYLES[c.prioridade] ?? ""}`}
                        >
                          {PRIORIDADE_LABELS[c.prioridade] ?? c.prioridade}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {c.trimestre}
                      </span>
                      {c.gravadoPor && (
                        <span className="text-xs text-muted-foreground">
                          • Gravado por {c.gravadoPor}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              </Card>
            </button>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-3">
              <Button
                variant="outline"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                disabled={isFetching}
                className="min-w-48"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Carregando...
                  </>
                ) : (
                  `Carregar mais ${Math.min(PAGE_SIZE, total - contents.length)}`
                )}
              </Button>
            </div>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground pt-1">
        Etapas disponíveis: {ETAPAS.join(", ")}.
      </p>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}: todos</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
