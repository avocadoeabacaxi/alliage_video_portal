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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CATEGORIAS_HERO,
  ETAPAS,
  PRIORIDADES,
  PRIORIDADE_LABELS,
  PRIORIDADE_STYLES,
  PRODUTOS,
  STATUS_FLOW,
  TIPOS,
  TRILHAS,
  TRILHA_LABELS,
  TRIMESTRES,
  trilhaLabel,
} from "@/lib/domain";
import { StatusBadge } from "@/components/StatusBadge";
import { CategoriaHeroBadge } from "@/components/CategoriaHero";
import { NovoConteudoDialog } from "@/components/NovoConteudoDialog";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const ALL = "__all__";
const PAGE_SIZE = 20;

export default function Conteudos() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [trilha, setTrilha] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [prioridade, setPrioridade] = useState(ALL);
  const [trimestre, setTrimestre] = useState(ALL);
  const [etapa, setEtapa] = useState(ALL);
  const [bloco, setBloco] = useState(ALL);
  const [responsavel, setResponsavel] = useState(ALL);
  const [categoriaHero, setCategoriaHero] = useState(ALL);
  const [tipo, setTipo] = useState(ALL);

  const [toDelete, setToDelete] = useState<{ id: number; titulo: string } | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const utils = trpc.useUtils();

  const baseFilters = useMemo(
    () => ({
      search: search.trim() || undefined,
      trilha: trilha === ALL ? undefined : trilha,
      status: status === ALL ? undefined : status,
      prioridade: prioridade === ALL ? undefined : prioridade,
      trimestre: trimestre === ALL ? undefined : trimestre,
      etapa: etapa === ALL ? undefined : etapa,
      bloco: bloco === ALL ? undefined : bloco,
      responsavel: responsavel === ALL ? undefined : responsavel,
      categoriaHero: categoriaHero === ALL ? undefined : categoriaHero,
      tipo: tipo === ALL ? undefined : (tipo as "Convencional" | "Hero"),
    }),
    [search, trilha, status, prioridade, trimestre, etapa, bloco, responsavel, categoriaHero, tipo],
  );

  useEffect(() => { setVisible(PAGE_SIZE); }, [baseFilters]);
  useEffect(() => { setBloco(ALL); }, [trilha]);

  const filters = useMemo(
    () => ({ ...baseFilters, limit: visible, offset: 0 }),
    [baseFilters, visible],
  );

  const { data, isLoading, isFetching, isError } = trpc.contents.list.useQuery(filters);
  const { data: responsaveis } = trpc.contents.responsaveis.useQuery();
  const blocoQuery = useMemo(
    () => ({ trilha: trilha === ALL ? undefined : trilha }),
    [trilha],
  );
  const { data: blocos } = trpc.contents.blocos.useQuery(blocoQuery);

  const deleteMut = trpc.contents.delete.useMutation({
    onSuccess: () => {
      toast.success("Conteúdo excluído.");
      utils.contents.list.invalidate();
      utils.contents.stats.invalidate();
      utils.contents.blocos.invalidate();
      setToDelete(null);
    },
    onError: (err) => {
      toast.error(err.message || "Não foi possível excluir.");
      setToDelete(null);
    },
  });

  const contents = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasMore = contents.length < total;

  const hasFilter =
    trilha !== ALL || status !== ALL || prioridade !== ALL || trimestre !== ALL ||
    etapa !== ALL || bloco !== ALL || responsavel !== ALL || categoriaHero !== ALL ||
    tipo !== ALL || search.trim() !== "";

  function clearFilters() {
    setSearch(""); setTrilha(ALL); setStatus(ALL); setPrioridade(ALL);
    setTrimestre(ALL); setEtapa(ALL); setBloco(ALL); setResponsavel(ALL);
    setCategoriaHero(ALL); setTipo(ALL);
  }

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Conteúdos</h1>
          <p className="text-muted-foreground mt-1">
            {data ? `Mostrando ${contents.length} de ${total} conteúdos` : "Carregando..."}{" "}
            • filtre, busque e abra a ficha para gerenciar a produção.
          </p>
        </div>
        <NovoConteudoDialog />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <div className="relative md:col-span-2 xl:col-span-2">
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
            placeholder="Marcas"
            options={TRILHAS.map((t) => ({ value: t, label: TRILHA_LABELS[t] }))}
          />
          <FilterSelect
            value={etapa}
            onChange={setEtapa}
            placeholder="Etapas"
            options={ETAPAS.map((e) => ({ value: e, label: e }))}
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
            options={PRIORIDADES.map((p) => ({ value: p, label: PRIORIDADE_LABELS[p] }))}
          />
          <FilterSelect
            value={trimestre}
            onChange={setTrimestre}
            placeholder="Trimestre"
            options={TRIMESTRES.map((t) => ({ value: t, label: t }))}
          />
          <FilterSelect
            value={bloco}
            onChange={setBloco}
            placeholder="Produtos"
            options={PRODUTOS.map((p) => ({ value: p, label: p }))}
          />
          <FilterSelect
            value={responsavel}
            onChange={setResponsavel}
            placeholder="Responsável"
            options={(responsaveis ?? []).map((r) => ({ value: r, label: r }))}
          />
          <FilterSelect
            value={categoriaHero}
            onChange={setCategoriaHero}
            placeholder="Categoria"
            options={CATEGORIAS_HERO.map((c) => ({ value: c, label: c }))}
          />
          <FilterSelect
            value={tipo}
            onChange={setTipo}
            placeholder="Tipo"
            options={TIPOS.map((t) => ({ value: t, label: t }))}
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
          {contents.map((c) => {
            const isHero = (c as any).tipo === "Hero";
            return (
              <Card
                key={c.id}
                className={`p-4 transition-all hover:shadow-md ${
                  isHero
                    ? "border-amber-300 bg-amber-50/30 hover:border-amber-400 hover:shadow-amber-100"
                    : "hover:border-[oklch(0.64_0.27_350)]/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => setLocation(`/conteudos/${c.id}`)}
                    className="flex flex-1 items-start gap-3 text-left min-w-0"
                  >
                    <div className="flex flex-col items-center justify-center w-12 shrink-0">
                      <span className="text-xs text-muted-foreground">#</span>
                      <span className="text-sm font-bold text-primary">{c.ordem}</span>
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
                        <span className="text-xs text-muted-foreground">{c.bloco}</span>
                        {(c as any).tipo === "Hero" && (
                          <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-300 border">
                            Hero
                          </Badge>
                        )}
                        {(c as any).categoriaHero && (
                          <CategoriaHeroBadge categoria={(c as any).categoriaHero} />
                        )}
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
                        <span className="text-xs text-muted-foreground">{c.trimestre}</span>
                        {c.gravadoPor && (
                          <span className="text-xs text-muted-foreground">
                            • Gravado por {c.gravadoPor}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatusBadge status={c.status} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setToDelete({ id: c.id, titulo: c.titulo })}
                      className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

          {hasMore && (
            <div className="flex justify-center pt-3">
              <Button
                variant="outline"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                disabled={isFetching}
                className="min-w-48"
              >
                {isFetching ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Carregando...</>
                ) : (
                  `Carregar mais ${Math.min(PAGE_SIZE, total - contents.length)}`
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conteúdo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O conteúdo
              {toDelete ? ` "${toDelete.titulo}"` : ""} será removido permanentemente da base.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (toDelete) deleteMut.mutate({ id: toDelete.id });
              }}
              disabled={deleteMut.isPending}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {deleteMut.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Excluindo...</>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
        <SelectItem value={ALL}>Todos</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
