import { and, asc, desc, eq, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, contents } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ---------------- Conteúdos ----------------

export type ContentFilters = {
  trilha?: string;
  status?: string;
  prioridade?: string;
  trimestre?: string;
  etapa?: string; // finalidade: Engajar/Inspirar/Educar/Converter
  bloco?: string;
  responsavel?: string; // gravadoPor (texto)
  categoriaHero?: string; // Odontologia Digital / Excelência Clínica / Negócios e Carreiras
  tipo?: string; // Convencional | Hero
  search?: string; // busca no título
  limit?: number;
  offset?: number;
};

function buildConditions(f: ContentFilters) {
  const conds = [] as any[];
  if (f.trilha) conds.push(eq(contents.trilha, f.trilha));
  if (f.status) conds.push(eq(contents.status, f.status as any));
  if (f.prioridade) conds.push(eq(contents.prioridade, f.prioridade));
  if (f.trimestre) conds.push(eq(contents.trimestre, f.trimestre));
  if (f.etapa) conds.push(eq(contents.etapa, f.etapa));
  if (f.bloco) conds.push(eq(contents.bloco, f.bloco));
  if (f.responsavel) conds.push(eq(contents.gravadoPor, f.responsavel));
  if (f.categoriaHero) conds.push(eq(contents.categoriaHero, f.categoriaHero));
  if (f.tipo) conds.push(eq(contents.tipo, f.tipo as any));
  if (f.search) conds.push(like(contents.titulo, `%${f.search}%`));
  return conds.length ? and(...conds) : undefined;
}

export async function listContents(f: ContentFilters) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const where = buildConditions(f);

  // Total (para saber se há mais páginas).
  const totalRows = await db
    .select({ c: sql<number>`count(*)` })
    .from(contents)
    .where(where ?? sql`1=1`);
  const total = Number(totalRows[0]?.c ?? 0);

  const limit = f.limit && f.limit > 0 ? f.limit : 20;
  const offset = f.offset && f.offset > 0 ? f.offset : 0;

  const items = await db
    .select()
    .from(contents)
    .where(where ?? sql`1=1`)
    .orderBy(asc(contents.trilha), asc(contents.ordem))
    .limit(limit)
    .offset(offset);

  return { items, total };
}

export async function getContentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(contents).where(eq(contents.id, id)).limit(1);
  return rows[0];
}

export async function updateContentStatus(
  id: number,
  status: string,
  user: { openId: string; name: string | null },
  extras?: {
    formatoApariciao?: string;
    pessoaApareceu?: string;
    localGravacao?: string;
  },
) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");

  const current = await getContentById(id);
  if (!current) throw new Error("Conteúdo não encontrado");

  const set: Record<string, unknown> = { status };

  // Ao marcar como Gravado (e ainda sem responsável), registra automaticamente
  // quem gravou e a data de gravação com base no usuário autenticado.
  if (status === "Gravado" && !current.gravadoPor) {
    set.gravadoPor = user.name ?? "Membro da equipe";
    set.gravadoPorOpenId = user.openId;
    set.dataGravacao = new Date();
  }

  // Dados informados ao marcar como Gravado (quem apareceu / onde gravou).
  if (extras?.formatoApariciao) set.formatoApariciao = extras.formatoApariciao;
  if (extras?.pessoaApareceu !== undefined)
    set.pessoaApareceu = extras.pessoaApareceu;
  if (extras?.localGravacao) set.localGravacao = extras.localGravacao;

  await db.update(contents).set(set).where(eq(contents.id, id));
  return getContentById(id);
}

export type ContentFieldUpdate = {
  categoriaHero?: string | null;
  tipo?: string | null;
  observacoes?: string | null;
  linkAprovacao?: string | null;
  linkVideoFinal?: string | null;
  dataGravacao?: Date | null;
  dataAgendada?: Date | null;
  formatoApariciao?: string | null;
  pessoaApareceu?: string | null;
  localGravacao?: string | null;
  gravadoPor?: string | null;
};

export async function updateContentFields(
  id: number,
  fields: ContentFieldUpdate,
  user: { openId: string; name: string | null },
) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");

  const current = await getContentById(id);
  if (!current) throw new Error("Conteúdo não encontrado");

  const set: Record<string, unknown> = {};
  if (fields.categoriaHero !== undefined) set.categoriaHero = fields.categoriaHero;
  if (fields.tipo !== undefined) set.tipo = fields.tipo;
  if (fields.observacoes !== undefined) set.observacoes = fields.observacoes;
  if (fields.linkAprovacao !== undefined) set.linkAprovacao = fields.linkAprovacao;
  if (fields.linkVideoFinal !== undefined) set.linkVideoFinal = fields.linkVideoFinal;
  if (fields.dataGravacao !== undefined) set.dataGravacao = fields.dataGravacao;
  if (fields.dataAgendada !== undefined) set.dataAgendada = fields.dataAgendada;
  if (fields.formatoApariciao !== undefined)
    set.formatoApariciao = fields.formatoApariciao;
  if (fields.pessoaApareceu !== undefined)
    set.pessoaApareceu = fields.pessoaApareceu;
  if (fields.localGravacao !== undefined) set.localGravacao = fields.localGravacao;
  // Permite renomear ou zerar quem gravou explicitamente.
  if (fields.gravadoPor !== undefined) set.gravadoPor = fields.gravadoPor;

  // Se ainda não há responsável e o usuário começou a preencher dados de produção,
  // registra automaticamente quem está atuando (apenas se não foi passado gravadoPor explicitamente).
  if (
    fields.gravadoPor === undefined &&
    !current.gravadoPor &&
    (fields.observacoes || fields.linkVideoFinal)
  ) {
    set.gravadoPor = user.name ?? "Membro da equipe";
    set.gravadoPorOpenId = user.openId;
  }

  if (Object.keys(set).length > 0) {
    await db.update(contents).set(set).where(eq(contents.id, id));
  }
  return getContentById(id);
}

// ---------------- Estatísticas do dashboard ----------------

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) {
    return {
      total: 0,
      byStatus: [],
      byTrilha: [],
      byPrioridade: [],
      byTrimestre: [],
      byEtapa: [],
      ranking: [],
    };
  }

  const byStatus = await db
    .select({ key: contents.status, count: sql<number>`count(*)` })
    .from(contents)
    .groupBy(contents.status);

  const byTrilhaStatus = await db
    .select({
      trilha: contents.trilha,
      status: contents.status,
      count: sql<number>`count(*)`,
    })
    .from(contents)
    .groupBy(contents.trilha, contents.status);

  const byPrioridade = await db
    .select({ key: contents.prioridade, count: sql<number>`count(*)` })
    .from(contents)
    .groupBy(contents.prioridade);

  const byTrimestreStatus = await db
    .select({
      trimestre: contents.trimestre,
      status: contents.status,
      count: sql<number>`count(*)`,
    })
    .from(contents)
    .groupBy(contents.trimestre, contents.status);

  const byEtapa = await db
    .select({ key: contents.etapa, count: sql<number>`count(*)` })
    .from(contents)
    .groupBy(contents.etapa);

  const ranking = await db
    .select({
      nome: contents.gravadoPor,
      count: sql<number>`count(*)`,
    })
    .from(contents)
    .where(sql`${contents.gravadoPor} is not null`)
    .groupBy(contents.gravadoPor)
    .orderBy(desc(sql`count(*)`));

  const total = byStatus.reduce((acc, r) => acc + Number(r.count), 0);

  return {
    total,
    byStatus: byStatus.map((r) => ({ key: r.key, count: Number(r.count) })),
    byTrilhaStatus: byTrilhaStatus.map((r) => ({
      trilha: r.trilha,
      status: r.status,
      count: Number(r.count),
    })),
    byPrioridade: byPrioridade.map((r) => ({
      key: r.key,
      count: Number(r.count),
    })),
    byTrimestreStatus: byTrimestreStatus.map((r) => ({
      trimestre: r.trimestre,
      status: r.status,
      count: Number(r.count),
    })),
    byEtapa: byEtapa.map((r) => ({ key: r.key, count: Number(r.count) })),
    ranking: ranking
      .filter((r) => r.nome)
      .map((r) => ({ nome: r.nome as string, count: Number(r.count) })),
  };
}

export async function getResponsaveis() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .selectDistinct({ nome: contents.gravadoPor })
    .from(contents)
    .where(sql`${contents.gravadoPor} is not null`);
  return rows.map((r) => r.nome).filter(Boolean) as string[];
}

/** Lista distinta de etapas (finalidade) presentes na base. */
export async function getEtapas() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.selectDistinct({ v: contents.etapa }).from(contents).orderBy(asc(contents.etapa));
  return rows.map((r) => r.v).filter(Boolean) as string[];
}

/** Lista distinta de blocos presentes na base (opcionalmente filtrada por trilha). */
export async function getBlocos(trilha?: string) {
  const db = await getDb();
  if (!db) return [];
  const where = trilha ? eq(contents.trilha, trilha) : undefined;
  const rows = await db
    .selectDistinct({ v: contents.bloco })
    .from(contents)
    .where(where ?? sql`1=1`)
    .orderBy(asc(contents.bloco));
  return rows.map((r) => r.v).filter(Boolean) as string[];
}

// ---------------- Criar / Excluir conteúdo ----------------

export type NewContentInput = {
  trilha: string;
  etapa: string;
  bloco: string;
  tipo?: "Convencional" | "Hero" | null;
  titulo: string;
  publico?: string | null;
  formatoProducao?: string | null;
  portaVoz?: string | null;
  prioridade?: string | null;
  trimestre?: string | null;
  gancho?: string | null;
  topico1?: string | null;
  topico2?: string | null;
  topico3?: string | null;
  palavrasChave?: string | null;
  dadoMercado?: string | null;
  cta?: string | null;
};

/** Cria um novo conteúdo. A ordem é calculada como max(ordem)+1 dentro da trilha. */
export async function createContent(input: NewContentInput) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");

  const maxRows = await db
    .select({ m: sql<number>`coalesce(max(${contents.ordem}), 0)` })
    .from(contents)
    .where(eq(contents.trilha, input.trilha));
  const nextOrdem = Number(maxRows[0]?.m ?? 0) + 1;

  const result = await db.insert(contents).values({
    trilha: input.trilha,
    ordem: nextOrdem,
    etapa: input.etapa,
    bloco: input.bloco,
    tipo: (input.tipo ?? "Convencional") as any,
    titulo: input.titulo,
    publico: input.publico ?? null,
    formatoProducao: input.formatoProducao ?? null,
    portaVoz: input.portaVoz ?? null,
    prioridade: input.prioridade ?? null,
    trimestre: input.trimestre ?? null,
    gancho: input.gancho ?? null,
    topico1: input.topico1 ?? null,
    topico2: input.topico2 ?? null,
    topico3: input.topico3 ?? null,
    palavrasChave: input.palavrasChave ?? null,
    dadoMercado: input.dadoMercado ?? null,
    cta: input.cta ?? null,
    status: "A gravar",
  });

  const insertId = Number((result as any)?.[0]?.insertId ?? (result as any)?.insertId ?? 0);
  return insertId ? getContentById(insertId) : undefined;
}

/** Exclui um conteúdo pelo id. Retorna true se removido. */
export async function deleteContent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");
  const current = await getContentById(id);
  if (!current) throw new Error("Conteúdo não encontrado");
  await db.delete(contents).where(eq(contents.id, id));
  return true;
}

/**
 * Lista os conteúdos agendados (dataAgendada não nula) dentro de um intervalo
 * [start, end). Usado pela Agenda mensal.
 */
export async function listAgendaBetween(start: Date, end: Date) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: contents.id,
      titulo: contents.titulo,
      trilha: contents.trilha,
      etapa: contents.etapa,
      prioridade: contents.prioridade,
      status: contents.status,
      portaVoz: contents.portaVoz,
      formatoProducao: contents.formatoProducao,
      categoriaHero: contents.categoriaHero,
      dataAgendada: contents.dataAgendada,
    })
    .from(contents)
    .where(
      and(
        sql`${contents.dataAgendada} is not null`,
        sql`${contents.dataAgendada} >= ${start}`,
        sql`${contents.dataAgendada} < ${end}`,
      ),
    )
    .orderBy(asc(contents.dataAgendada), asc(contents.trilha), asc(contents.ordem));
}

/** Define ou remove (null) a data agendada de um conteúdo. */
export async function setDataAgendada(id: number, data: Date | null) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");
  const current = await getContentById(id);
  if (!current) throw new Error("Conteúdo não encontrado");
  await db
    .update(contents)
    .set({ dataAgendada: data })
    .where(eq(contents.id, id));
  return getContentById(id);
}
