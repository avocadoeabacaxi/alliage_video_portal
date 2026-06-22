export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// ---- Domínio Alliage Experience ----
export const STATUS_FLOW = [
  "A gravar",
  "Gravado",
  "Em edição",
  "Aprovação",
  "Publicado",
] as const;
export type ContentStatus = (typeof STATUS_FLOW)[number];

export const TRILHAS = [
  "Dabi Atlante",
  "Saevo",
  "PreXion",
  "Alliage Gestao",
  "Alliage Tecnico",
] as const;

export const PRIORIDADES = ["Alta", "Media", "Baixa"] as const;

export const TRIMESTRES = [
  "Q1 - Ago/2026",
  "Q2 - Nov/2026",
  "Q3 - Fev/2027",
  "Q4 - Mai/2027",
] as const;

export const ETAPAS = ["Engajar", "Inspirar", "Educar", "Converter"] as const;
