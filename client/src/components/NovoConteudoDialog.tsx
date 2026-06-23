import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ETAPAS,
  PRIORIDADES,
  PRIORIDADE_LABELS,
  TRILHAS,
  TRILHA_LABELS,
  TRIMESTRES,
} from "@/lib/domain";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

type FormState = {
  trilha: string;
  etapa: string;
  bloco: string;
  titulo: string;
  publico: string;
  formatoProducao: string;
  portaVoz: string;
  prioridade: string;
  trimestre: string;
  gancho: string;
  topico1: string;
  topico2: string;
  topico3: string;
  palavrasChave: string;
  dadoMercado: string;
  cta: string;
};

const EMPTY: FormState = {
  trilha: "",
  etapa: "",
  bloco: "",
  titulo: "",
  publico: "",
  formatoProducao: "",
  portaVoz: "",
  prioridade: "",
  trimestre: "",
  gancho: "",
  topico1: "",
  topico2: "",
  topico3: "",
  palavrasChave: "",
  dadoMercado: "",
  cta: "",
};

export function NovoConteudoDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const utils = trpc.useUtils();

  const createMut = trpc.contents.create.useMutation({
    onSuccess: () => {
      toast.success("Conteúdo criado com sucesso!");
      utils.contents.list.invalidate();
      utils.contents.stats.invalidate();
      utils.contents.blocos.invalidate();
      setForm(EMPTY);
      setOpen(false);
      onCreated?.();
    },
    onError: (err) => {
      toast.error(err.message || "Não foi possível criar o conteúdo.");
    },
  });

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit() {
    if (!form.trilha) return toast.error("Selecione a trilha.");
    if (!form.etapa) return toast.error("Selecione a etapa.");
    if (!form.bloco.trim()) return toast.error("Informe o bloco.");
    if (!form.titulo.trim()) return toast.error("Informe o título.");

    const orNull = (v: string) => (v.trim() ? v.trim() : null);
    createMut.mutate({
      trilha: form.trilha,
      etapa: form.etapa,
      bloco: form.bloco.trim(),
      titulo: form.titulo.trim(),
      publico: orNull(form.publico),
      formatoProducao: orNull(form.formatoProducao),
      portaVoz: orNull(form.portaVoz),
      prioridade: form.prioridade || null,
      trimestre: form.trimestre || null,
      gancho: orNull(form.gancho),
      topico1: orNull(form.topico1),
      topico2: orNull(form.topico2),
      topico3: orNull(form.topico3),
      palavrasChave: orNull(form.palavrasChave),
      dadoMercado: orNull(form.dadoMercado),
      cta: orNull(form.cta),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" /> Novo conteúdo
      </Button>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar novo conteúdo</DialogTitle>
          <DialogDescription>
            Preencha os campos da pauta. O status inicial será "A gravar".
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <Field label="Trilha *">
            <Select value={form.trilha} onValueChange={(v) => set("trilha", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {TRILHAS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TRILHA_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Etapa / Finalidade *">
            <Select value={form.etapa} onValueChange={(v) => set("etapa", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {ETAPAS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Bloco *">
            <Input
              value={form.bloco}
              onChange={(e) => set("bloco", e.target.value)}
              placeholder="Ex.: Bloco 1 - Apresentação"
            />
          </Field>

          <Field label="Prioridade">
            <Select
              value={form.prioridade}
              onValueChange={(v) => set("prioridade", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {PRIORIDADES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PRIORIDADE_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Título *" full>
            <Input
              value={form.titulo}
              onChange={(e) => set("titulo", e.target.value)}
              placeholder="Título do conteúdo"
            />
          </Field>

          <Field label="Trimestre">
            <Select
              value={form.trimestre}
              onValueChange={(v) => set("trimestre", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {TRIMESTRES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Porta-Voz">
            <Input
              value={form.portaVoz}
              onChange={(e) => set("portaVoz", e.target.value)}
              placeholder="Ex.: Especialista, CEO..."
            />
          </Field>

          <Field label="Público">
            <Input
              value={form.publico}
              onChange={(e) => set("publico", e.target.value)}
              placeholder="Ex.: Dentistas, Clínicas..."
            />
          </Field>

          <Field label="Formato de Produção">
            <Input
              value={form.formatoProducao}
              onChange={(e) => set("formatoProducao", e.target.value)}
              placeholder="Ex.: Reels, Vídeo longo..."
            />
          </Field>

          <Field label="Gancho" full>
            <Textarea
              value={form.gancho}
              onChange={(e) => set("gancho", e.target.value)}
              placeholder="Frase de abertura / gancho"
              rows={2}
            />
          </Field>

          <Field label="Tópico 1">
            <Input
              value={form.topico1}
              onChange={(e) => set("topico1", e.target.value)}
            />
          </Field>
          <Field label="Tópico 2">
            <Input
              value={form.topico2}
              onChange={(e) => set("topico2", e.target.value)}
            />
          </Field>
          <Field label="Tópico 3">
            <Input
              value={form.topico3}
              onChange={(e) => set("topico3", e.target.value)}
            />
          </Field>

          <Field label="Palavras-chave">
            <Input
              value={form.palavrasChave}
              onChange={(e) => set("palavrasChave", e.target.value)}
            />
          </Field>

          <Field label="Dado de Mercado" full>
            <Textarea
              value={form.dadoMercado}
              onChange={(e) => set("dadoMercado", e.target.value)}
              rows={2}
            />
          </Field>

          <Field label="CTA (Chamada para ação)" full>
            <Input
              value={form.cta}
              onChange={(e) => set("cta", e.target.value)}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createMut.isPending}>
            {createMut.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...
              </>
            ) : (
              "Criar conteúdo"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
