// Mapeamentos de domínio para exibição no portal Alliage Experience.

export const STATUS_FLOW = [
  "A gravar",
  "Gravado",
  "Em edição",
  "Aprovação",
  "Publicado",
] as const;
export type ContentStatus = (typeof STATUS_FLOW)[number];

// Cores das badges de status (classes Tailwind).
export const STATUS_STYLES: Record<string, string> = {
  "A gravar": "bg-slate-100 text-slate-700 border-slate-200",
  Gravado: "bg-blue-100 text-blue-700 border-blue-200",
  "Em edição": "bg-amber-100 text-amber-700 border-amber-200",
  Aprovação: "bg-violet-100 text-violet-700 border-violet-200",
  Publicado: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

// Cor sólida (hex) para gráficos por status.
export const STATUS_COLORS: Record<string, string> = {
  "A gravar": "#94a3b8",
  Gravado: "#2563eb",
  "Em edição": "#f59e0b",
  Aprovação: "#8b5cf6",
  Publicado: "#10b981",
};

// Nomes "bonitos" das trilhas (a base usa nomes sem acento).
export const TRILHA_LABELS: Record<string, string> = {
  "Dabi Atlante": "Dabi Atlante",
  Saevo: "Saevo",
  PreXion: "PreXion",
  "Alliage Gestao": "Alliage Gestão",
  "Alliage Tecnico": "Alliage Técnico",
};

export const TRILHAS = Object.keys(TRILHA_LABELS);

export const TRILHA_COLORS: Record<string, string> = {
  "Dabi Atlante": "#1e3a8a",
  Saevo: "#7c3aed",
  PreXion: "#0891b2",
  "Alliage Gestao": "#db2777",
  "Alliage Tecnico": "#ea580c",
};

export const PRIORIDADES = ["Alta", "Media", "Baixa"] as const;
export const PRIORIDADE_LABELS: Record<string, string> = {
  Alta: "Alta",
  Media: "Média",
  Baixa: "Baixa",
};
export const PRIORIDADE_STYLES: Record<string, string> = {
  Alta: "bg-rose-100 text-rose-700 border-rose-200",
  Media: "bg-sky-100 text-sky-700 border-sky-200",
  Baixa: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

export const TRIMESTRES = [
  "Q1 - Ago/2026",
  "Q2 - Nov/2026",
  "Q3 - Fev/2027",
  "Q4 - Mai/2027",
] as const;

export const ETAPAS = ["Engajar", "Inspirar", "Educar", "Converter"] as const;

export const LOGO_ALLIAGE = "/manus-storage/logo_alliage_c397aa14.png";
export const LOGO_AVOCADO = "/manus-storage/logo_avocado_9b86bc01.png";
export const LOGO_ALLIAGE_EXPERIENCE =
  "/manus-storage/alliage_experience_logo_545ece7e.png";

export function trilhaLabel(t?: string | null) {
  if (!t) return "-";
  return TRILHA_LABELS[t] ?? t;
}
export function prioridadeLabel(p?: string | null) {
  if (!p) return "-";
  return PRIORIDADE_LABELS[p] ?? p;
}
