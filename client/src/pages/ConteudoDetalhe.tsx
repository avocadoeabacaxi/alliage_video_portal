import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  PRIORIDADE_LABELS,
  PRIORIDADE_STYLES,
  STATUS_FLOW,
  trilhaLabel,
} from "@/lib/domain";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Link2,
  Loader2,
  MapPin,
  Save,
  User,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConteudoDetalhe() {
  const [, params] = useRoute("/conteudos/:id");
  const [, setLocation] = useLocation();
  const id = params?.id ? parseInt(params.id, 10) : NaN;
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: content, isLoading } = trpc.contents.get.useQuery(
    { id },
    { enabled: !isNaN(id) },
  );

  const [observacoes, setObservacoes] = useState("");
  const [linkAprovacao, setLinkAprovacao] = useState("");
  const [linkVideoFinal, setLinkVideoFinal] = useState("");
  const [dataGravacao, setDataGravacao] = useState("");
  const [dataAgendada, setDataAgendada] = useState("");
  const [formatoApariciao, setFormatoApariciao] = useState("");
  const [localGravacao, setLocalGravacao] = useState("");

  // Modal exibido ao marcar como "Gravado".
  const [gravadoModalOpen, setGravadoModalOpen] = useState(false);
  const [modalAparicao, setModalAparicao] = useState("Pessoa real");
  const [modalLocal, setModalLocal] = useState("");

  useEffect(() => {
    if (content) {
      setObservacoes(content.observacoes ?? "");
      setLinkAprovacao(content.linkAprovacao ?? "");
      setLinkVideoFinal(content.linkVideoFinal ?? "");
      setDataGravacao(
        content.dataGravacao
          ? new Date(content.dataGravacao).toISOString().slice(0, 10)
          : "",
      );
      setDataAgendada(
        content.dataAgendada
          ? new Date(content.dataAgendada).toISOString().slice(0, 10)
          : "",
      );
      setFormatoApariciao(content.formatoApariciao ?? "");
      setLocalGravacao(content.localGravacao ?? "");
    }
  }, [content]);

  const updateStatus = trpc.contents.updateStatus.useMutation({
    onSuccess: () => {
      utils.contents.get.invalidate({ id });
      utils.contents.stats.invalidate();
      utils.contents.list.invalidate();
      utils.contents.responsaveis.invalidate();
      setGravadoModalOpen(false);
      toast.success("Status atualizado");
    },
    onError: (e) => toast.error(e.message),
  });

  // Ao clicar numa etapa do fluxo. Se for "Gravado" e ainda não houver
  // registro de quem apareceu, abre o modal para coletar os dados.
  function handleStatusClick(novoStatus: (typeof STATUS_FLOW)[number]) {
    if (novoStatus === content?.status) return;
    if (novoStatus === "Gravado" && !content?.formatoApariciao) {
      setModalAparicao("Pessoa real");
      setModalLocal(localGravacao || "");
      setGravadoModalOpen(true);
      return;
    }
    updateStatus.mutate({ id, status: novoStatus });
  }

  function confirmarGravado() {
    updateStatus.mutate({
      id,
      status: "Gravado",
      formatoApariciao: modalAparicao as any,
      localGravacao: modalLocal.trim() || null,
    });
  }

  const updateFields = trpc.contents.updateFields.useMutation({
    onSuccess: () => {
      utils.contents.get.invalidate({ id });
      utils.contents.stats.invalidate();
      utils.contents.list.invalidate();
      utils.contents.agendaMes.invalidate();
      toast.success("Informações salvas");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-5xl">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="max-w-5xl">
        <Button variant="ghost" onClick={() => setLocation("/conteudos")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <Card className="p-12 text-center text-muted-foreground mt-4">
          Conteúdo não encontrado.
        </Card>
      </div>
    );
  }

  const topicos = [content.topico1, content.topico2, content.topico3].filter(
    Boolean,
  );
  const palavras = (content.palavrasChave ?? "")
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean);

  function isValidUrl(v: string) {
    try {
      const u = new URL(v);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  function handleSaveFields() {
    if (linkAprovacao && !isValidUrl(linkAprovacao)) {
      toast.error("O link de aprovação deve ser uma URL válida (https://...)");
      return;
    }
    if (linkVideoFinal && !isValidUrl(linkVideoFinal)) {
      toast.error("O link do vídeo final deve ser uma URL válida (https://...)");
      return;
    }
    updateFields.mutate({
      id,
      observacoes: observacoes || null,
      linkAprovacao: linkAprovacao || null,
      linkVideoFinal: linkVideoFinal || null,
      dataGravacao: dataGravacao ? new Date(dataGravacao) : null,
      dataAgendada: dataAgendada ? new Date(dataAgendada + "T00:00:00") : null,
      formatoApariciao: (formatoApariciao || null) as any,
      localGravacao: localGravacao || null,
    });
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => setLocation("/conteudos")}
          className="text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para a lista
        </Button>
        <StatusBadge status={content.status} className="text-sm px-3 py-1" />
      </div>

      {/* Cabeçalho */}
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[oklch(0.32_0.07_254)] to-[oklch(0.64_0.27_350)]" />
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className="bg-primary text-primary-foreground">
              {trilhaLabel(content.trilha)}
            </Badge>
            <Badge variant="outline">{content.etapa}</Badge>
            <Badge variant="outline">{content.bloco}</Badge>
            {content.prioridade && (
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PRIORIDADE_STYLES[content.prioridade] ?? ""}`}
              >
                Prioridade {PRIORIDADE_LABELS[content.prioridade]}
              </span>
            )}
            <Badge variant="outline" className="ml-auto">
              {content.trimestre}
            </Badge>
          </div>
          <h1 className="text-xl md:text-2xl font-bold leading-snug">
            {content.titulo}
          </h1>
          <span className="text-sm text-muted-foreground">
            Ordem #{content.ordem}
          </span>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Coluna pauta (campos da planilha) */}
        <div className="lg:col-span-3 space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pauta do conteúdo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <Field label="Gancho (15s)" value={content.gancho} highlight />
              {topicos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                    Tópicos
                  </p>
                  <ol className="space-y-2 list-decimal list-inside marker:text-[oklch(0.64_0.27_350)] marker:font-bold">
                    {topicos.map((t, i) => (
                      <li key={i} className="leading-relaxed">
                        {t}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              <Field label="Dado de Mercado" value={content.dadoMercado} />
              <Field label="CTA" value={content.cta} />
              {palavras.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                    Palavras-chave
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {palavras.map((p, i) => (
                      <Badge key={i} variant="secondary" className="font-normal">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Produção</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <Field label="Público" value={content.publico} />
              <Field label="Formato" value={content.formatoProducao} />
              <Field label="Porta-Voz" value={content.portaVoz} />
            </CardContent>
          </Card>
        </div>

        {/* Coluna gestão (editável) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Fluxo de status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Status da produção</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                {STATUS_FLOW.map((s, i) => {
                  const currentIdx = STATUS_FLOW.indexOf(
                    content.status as any,
                  );
                  const done = i <= currentIdx;
                  const isCurrent = s === content.status;
                  return (
                    <button
                      key={s}
                      disabled={updateStatus.isPending}
                      onClick={() => !isCurrent && handleStatusClick(s)}
                      className={`w-full flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-all ${
                        isCurrent
                          ? "border-[oklch(0.64_0.27_350)] bg-accent font-semibold"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <span
                        className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                          done
                            ? "bg-[oklch(0.32_0.07_254)] text-white"
                            : "bg-muted text-muted-foreground border"
                        }`}
                      >
                        {done ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                      </span>
                      <span className="flex-1 text-left">{s}</span>
                      {isCurrent && (
                        <span className="text-[10px] text-[oklch(0.64_0.27_350)] font-bold uppercase">
                          atual
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Clique em uma etapa para mudar o status. Ao marcar como
                "Gravado", o responsável é registrado automaticamente.
              </p>
            </CardContent>
          </Card>

          {/* Responsável */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-[oklch(0.64_0.27_350)]" /> Quem
                gravou
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {content.gravadoPor ? (
                <div className="space-y-2">
                  <div>
                    <p className="font-semibold">{content.gravadoPor}</p>
                    {content.dataGravacao && (
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Gravado em{" "}
                        {new Date(content.dataGravacao).toLocaleDateString(
                          "pt-BR",
                        )}
                      </p>
                    )}
                  </div>
                  {content.formatoApariciao && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Video className="h-3.5 w-3.5 text-[oklch(0.64_0.27_350)]" />
                      <span className="text-muted-foreground">Aparição:</span>
                      <Badge variant="secondary" className="font-normal">
                        {content.formatoApariciao}
                      </Badge>
                    </div>
                  )}
                  {content.localGravacao && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <MapPin className="h-3.5 w-3.5 text-[oklch(0.64_0.27_350)]" />
                      <span className="text-muted-foreground">Local:</span>
                      <span className="font-medium">{content.localGravacao}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Ainda não registrado. Será preenchido automaticamente com{" "}
                  <span className="font-medium">{user?.name}</span> ao marcar
                  como "Gravado".
                </p>
              )}
            </CardContent>
          </Card>

          {/* Campos editáveis */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Registros da equipe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="agendada" className="flex items-center gap-1.5">
                  <CalendarClock className="h-4 w-4 text-[oklch(0.64_0.27_350)]" />
                  Data agendada (cronograma)
                </Label>
                <Input
                  id="agendada"
                  type="date"
                  value={dataAgendada}
                  onChange={(e) => setDataAgendada(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Aparece na Agenda do mês. Deixe em branco para remover do cronograma.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="data">Data de gravação (realizada)</Label>
                <Input
                  id="data"
                  type="date"
                  value={dataGravacao}
                  onChange={(e) => setDataGravacao(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Video className="h-4 w-4 text-[oklch(0.64_0.27_350)]" />
                  Quem apareceu na filmagem
                </Label>
                <select
                  value={formatoApariciao}
                  onChange={(e) => setFormatoApariciao(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Não informado</option>
                  <option value="Pessoa real">Pessoa real</option>
                  <option value="IA">IA</option>
                  <option value="Off / Locução">Off / Locução</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="local" className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[oklch(0.64_0.27_350)]" />
                  Onde está sendo gravado
                </Label>
                <Input
                  id="local"
                  placeholder="Ex.: Estúdio Avocado, Sede Alliage, externa..."
                  value={localGravacao}
                  onChange={(e) => setLocalGravacao(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="obs">Observações / apresentação deixada</Label>
                <Textarea
                  id="obs"
                  rows={3}
                  placeholder="Ex.: deixou roteiro impresso, apresentação em PDF, observações sobre o local..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="aprov">Link de aprovação do vídeo</Label>
                <div className="flex gap-2">
                  <Input
                    id="aprov"
                    placeholder="https://..."
                    value={linkAprovacao}
                    onChange={(e) => setLinkAprovacao(e.target.value)}
                  />
                  {linkAprovacao && (
                    <Button variant="outline" size="icon" asChild>
                      <a href={linkAprovacao} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="final">Link do vídeo final</Label>
                <div className="flex gap-2">
                  <Input
                    id="final"
                    placeholder="https://..."
                    value={linkVideoFinal}
                    onChange={(e) => setLinkVideoFinal(e.target.value)}
                  />
                  {linkVideoFinal && (
                    <Button variant="outline" size="icon" asChild>
                      <a href={linkVideoFinal} target="_blank" rel="noreferrer">
                        <Link2 className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              <Button
                onClick={handleSaveFields}
                disabled={updateFields.isPending}
                className="w-full"
              >
                {updateFields.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar informações
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal: ao marcar como Gravado, registra quem apareceu e onde gravou */}
      <Dialog open={gravadoModalOpen} onOpenChange={setGravadoModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[oklch(0.64_0.27_350)]" />
              Marcar como Gravado
            </DialogTitle>
            <DialogDescription>
              {user?.name
                ? `${user.name} será registrado(a) como responsável.`
                : "Você será registrado(a) como responsável."}{" "}
              Informe os dados da gravação.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Video className="h-4 w-4 text-[oklch(0.64_0.27_350)]" />
                Quem apareceu na filmagem?
              </Label>
              <RadioGroup
                value={modalAparicao}
                onValueChange={setModalAparicao}
                className="grid grid-cols-1 gap-2"
              >
                {["Pessoa real", "IA", "Off / Locução"].map((op) => (
                  <label
                    key={op}
                    htmlFor={`ap-${op}`}
                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                      modalAparicao === op
                        ? "border-[oklch(0.64_0.27_350)] bg-accent"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <RadioGroupItem value={op} id={`ap-${op}`} />
                    <span className="text-sm font-medium">{op}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modal-local" className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[oklch(0.64_0.27_350)]" />
                Onde está sendo gravado?
              </Label>
              <Input
                id="modal-local"
                placeholder="Ex.: Estúdio Avocado, Sede Alliage, externa..."
                value={modalLocal}
                onChange={(e) => setModalLocal(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGravadoModalOpen(false)}
              disabled={updateStatus.isPending}
            >
              Cancelar
            </Button>
            <Button onClick={confirmarGravado} disabled={updateStatus.isPending}>
              {updateStatus.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Confirmar gravação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  value,
  highlight,
}: {
  label: string;
  value?: string | null;
  highlight?: boolean;
}) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </p>
      <p
        className={`leading-relaxed ${
          highlight
            ? "text-foreground font-medium bg-accent/50 rounded-md p-2.5 border-l-2 border-[oklch(0.64_0.27_350)]"
            : "text-foreground/90"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
