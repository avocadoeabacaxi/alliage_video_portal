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
  responsavel?: string; // gravadoPor (texto)
  search?: string; // busca no título
};

function buildConditions(f: ContentFilters) {
  const conds = [] as any[];
  if (f.trilha) conds.push(eq(contents.trilha, f.trilha));
  if (f.status) conds.push(eq(contents.status, f.status as any));
  if (f.prioridade) conds.push(eq(contents.prioridade, f.prioridade));
  if (f.trimestre) conds.push(eq(contents.trimestre, f.trimestre));
  if (f.responsavel) conds.push(eq(contents.gravadoPor, f.responsavel));
  if (f.search) conds.push(like(contents.titulo, `%${f.search}%`));
  return conds.length ? and(...conds) : undefined;
}

export async function listContents(f: ContentFilters) {
  const db = await getDb();
  if (!db) return [];
  const where = buildConditions(f);
  const query = db
    .select()
    .from(contents)
    .orderBy(asc(contents.trilha), asc(contents.ordem));
  if (where) return query.where(where);
  return query;
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

  await db.update(contents).set(set).where(eq(contents.id, id));
  return getContentById(id);
}

export type ContentFieldUpdate = {
  observacoes?: string | null;
  linkAprovacao?: string | null;
  linkVideoFinal?: string | null;
  dataGravacao?: Date | null;
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
  if (fields.observacoes !== undefined) set.observacoes = fields.observacoes;
  if (fields.linkAprovacao !== undefined) set.linkAprovacao = fields.linkAprovacao;
  if (fields.linkVideoFinal !== undefined) set.linkVideoFinal = fields.linkVideoFinal;
  if (fields.dataGravacao !== undefined) set.dataGravacao = fields.dataGravacao;

  // Se ainda não há responsável e o usuário começou a preencher dados de produção,
  // registra automaticamente quem está atuando.
  if (!current.gravadoPor && (fields.observacoes || fields.linkVideoFinal)) {
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
