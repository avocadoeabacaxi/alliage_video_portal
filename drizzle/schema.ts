import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Conteúdos das 5 trilhas Alliage Experience.
 * Os campos vindos da planilha são imutáveis (dados de pauta); os campos de
 * produção (status, gravadoPor, etc.) são editados pela equipe no portal.
 */
export const contents = mysqlTable("contents", {
  id: int("id").autoincrement().primaryKey(),

  // ---- Campos importados da planilha (pauta) ----
  trilha: varchar("trilha", { length: 64 }).notNull(),
  ordem: int("ordem").notNull(),
  etapa: varchar("etapa", { length: 32 }).notNull(),
  bloco: varchar("bloco", { length: 128 }).notNull(),
  titulo: text("titulo").notNull(),
  publico: varchar("publico", { length: 128 }),
  formatoProducao: varchar("formatoProducao", { length: 64 }),
  portaVoz: text("portaVoz"),
  prioridade: varchar("prioridade", { length: 16 }),
  trimestre: varchar("trimestre", { length: 32 }),
  gancho: text("gancho"),
  topico1: text("topico1"),
  topico2: text("topico2"),
  topico3: text("topico3"),
  palavrasChave: text("palavrasChave"),
  dadoMercado: text("dadoMercado"),
  cta: text("cta"),

  // ---- Campos de produção (editáveis no portal) ----
  status: mysqlEnum("status", [
    "A gravar",
    "Gravado",
    "Em edição",
    "Aprovação",
    "Publicado",
  ])
    .default("A gravar")
    .notNull(),
  gravadoPor: text("gravadoPor"),
  gravadoPorOpenId: varchar("gravadoPorOpenId", { length: 64 }),
  dataGravacao: timestamp("dataGravacao"),
  observacoes: text("observacoes"),
  linkAprovacao: text("linkAprovacao"),
  linkVideoFinal: text("linkVideoFinal"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Content = typeof contents.$inferSelect;
export type InsertContent = typeof contents.$inferInsert;
